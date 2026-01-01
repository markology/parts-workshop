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

  if (req.method === "GET") {
    try {
      const map = await prisma.map.findFirst({
        where: { 
          id,
          userId: session.user.id 
        }
      });

      if (!map) {
        return res.status(404).json({ error: "Map not found" });
      }

      // Fetch journal entries separately since there's no direct relation
      const journalEntries = await prisma.journalEntry.findMany({
        where: { 
          userId: session.user.id,
          nodeId: null // Global journal entries, not linked to specific nodes
        }
      });

      // Map data fetched successfully

      return res.status(200).json({
        ...map,
        journalEntries,
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch map" });
    }
  }

  if (req.method === "POST" || req.method === "PUT") {
    try {
      let body = req.body;
      
      // Saving map data to database
      
      if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
        return res
          .status(400)
          .json({ error: "Invalid payload: nodes or edges missing" });
      }

      // Handle raw stream from sendBeacon
      if (body instanceof ReadableStream) {
        const raw = await streamToString(body);
        body = JSON.parse(raw);
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

      // Store workspaceBgColor and activeTheme in sidebarImpressions as metadata for now
      // TODO: Add dedicated workspaceBgColor field to schema
      const sidebarImpressionsWithBg = body.sidebarImpressions || {};
      const sidebarImpressionsData = {
        ...sidebarImpressionsWithBg,
        _metadata: {
          ...(typeof sidebarImpressionsWithBg === "object" &&
          "_metadata" in sidebarImpressionsWithBg
            ? (sidebarImpressionsWithBg as any)._metadata
            : {}),
          workspaceBgColor: body.workspaceBgColor,
          activeTheme: body.activeTheme || "light",
        },
      };

      await prisma.map.update({
        where: { id },
        data: {
          nodes: body.nodes,
          edges: body.edges,
          sidebarImpressions: sidebarImpressionsData,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Update failed" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Delete the map
      await prisma.map.delete({
        where: { id },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Delete failed" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
