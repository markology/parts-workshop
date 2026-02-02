import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import { decryptMapData, encryptMapData } from "@/lib/encryption";
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

      // Decrypt sensitive data in each map
      const decryptedMaps = maps.map((map) => {
        try {
          const decrypted = decryptMapData({
            nodes: map.nodes as any,
            edges: map.edges as any,
            title: map.title,
            sidebarImpressions: map.sidebarImpressions as any,
          });
          return {
            ...map,
            nodes: decrypted.nodes,
            edges: decrypted.edges,
            title: decrypted.title,
            sidebarImpressions: decrypted.sidebarImpressions,
          };
        } catch (error) {
          // If decryption fails, return map as-is (might be unencrypted legacy data)
          console.error("Error decrypting map:", error);
          return map;
        }
      });

      return res.status(200).json(decryptedMaps);
    } catch (error) {
      console.error("Error fetching maps:", error);
      return res.status(500).json({ error: "Failed to fetch maps" });
    }
  }

  if (req.method === "POST") {
    try {
      const { title, nodes, edges, sidebarImpressions } = req.body;

      // Encrypt sensitive data before saving
      const encryptedMapData = encryptMapData({
        nodes,
        edges,
        title,
        sidebarImpressions,
      });

      const newMap = await prisma.map.create({
        data: {
          userId: session.user.id,
          title: encryptedMapData.title || title,
          nodes: encryptedMapData.nodes,
          edges: encryptedMapData.edges,
          sidebarImpressions: encryptedMapData.sidebarImpressions,
        },
      });

      // Decrypt for response
      const decrypted = decryptMapData({
        nodes: newMap.nodes as any,
        edges: newMap.edges as any,
        title: newMap.title,
        sidebarImpressions: newMap.sidebarImpressions as any,
      });

      return res.status(201).json({
        ...newMap,
        nodes: decrypted.nodes,
        edges: decrypted.edges,
        title: decrypted.title,
        sidebarImpressions: decrypted.sidebarImpressions,
      });
    } catch {
      return res.status(500).json({ error: "Failed to create map" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
