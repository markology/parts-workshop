import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

const streamToString = async (stream: ReadableStream<Uint8Array>) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = session.user.id;
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid ID" });
  }

  if (req.method === "POST" || req.method === "PUT") {
    try {
      let body = req.body;
      if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
        return res
          .status(400)
          .json({ error: "Invalid payload: nodes or edges missing" });
      }

      // Handle raw stream from sendBeacon
      if (body instanceof ReadableStream) {
        const raw = await streamToString(body);
        body = JSON.parse(raw);
        console.log("READABLE STREAM", body);
      }

      const validNodeIds = body.nodes.map((n: { id: string }) => n.id);

      // 🧹 Purge orphaned journal entries (excluding global)
      await prisma.journalEntry.deleteMany({
        where: {
          userId,
          nodeId: {
            notIn: validNodeIds,
            not: null,
          },
        },
      });

      await prisma.map.update({
        where: { id },
        data: {
          nodes: body.nodes,
          edges: body.edges,
          sidebarImpressions: body.sidebarImpressions,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Map save failed:", error);
      return res.status(500).json({ error: "Update failed" });
    }
  }

  res.setHeader("Allow", ["POST", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
