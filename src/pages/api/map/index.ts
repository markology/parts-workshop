import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.headers["x-user-id"] as string;

  if (!userId) return res.status(401).json({ message: "Missing user ID" });

  if (req.method === "GET") {
    const maps = await prisma.map.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return res.json(maps);
  }

  if (req.method === "POST") {
    const { title, nodes, edges, sidebarImpressions } = req.body;

    const newMap = await prisma.map.create({
      data: {
        userId,
        title,
        nodes,
        edges,
        sidebarImpressions,
      },
    });

    return res.status(201).json(newMap);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
