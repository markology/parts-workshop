import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const mapId = req.query.id as string;
  const userId = req.headers["x-user-id"] as string;

  if (!userId) return res.status(401).json({ message: "Missing user ID" });

  if (req.method === "GET") {
    const map = await prisma.map.findFirst({
      where: { id: mapId, userId },
    });

    if (!map) return res.status(404).json({ message: "Map not found" });

    return res.status(200).json(map);
  }

  if (req.method === "PUT") {
    const { title, nodes, edges, sidebarImpressions } = req.body;

    const updated = await prisma.map.updateMany({
      where: { id: mapId, userId },
      data: {
        title,
        nodes,
        edges,
        sidebarImpressions,
      },
    });

    if (updated.count === 0) {
      return res
        .status(404)
        .json({ message: "Map not found or not owned by user" });
    }

    return res.status(200).json({ message: "Map updated" });
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
