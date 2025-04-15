import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const maps = await prisma.map.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
      });

      return res.status(200).json(maps);
    } catch {
      return res.status(500).json({ error: "Failed to fetch maps" });
    }
  }

  if (req.method === "POST") {
    try {
      const { title, nodes, edges, sidebarImpressions } = req.body;

      const newMap = await prisma.map.create({
        data: {
          userId: session.user.id,
          title,
          nodes,
          edges,
          sidebarImpressions,
        },
      });

      return res.status(201).json(newMap);
    } catch {
      return res.status(500).json({ error: "Failed to create map" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
