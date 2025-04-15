import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid ID" });
  }

  if (req.method === "POST" || req.method === "PUT") {
    try {
      const body = req.body;

      // In case sendBeacon sends plain Blob with no JSON parsing,
      // you may need to add this (depending on your setup):
      if (typeof body === "string") {
        req.body = JSON.parse(body);
      }

      const updated = await prisma.map.update({
        where: { id },
        data: {
          nodes: body.nodes,
          edges: body.edges,
          sidebarImpressions: body.sidebarImpressions,
        },
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Update failed" });
    }
  }

  res.setHeader("Allow", ["POST", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
