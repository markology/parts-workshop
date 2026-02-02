import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { decrypt, decryptJson, encryptMapData, decryptMapData } from "@/lib/encryption";

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

      // Decrypt sensitive fields in journal entries
      const decryptedJournalEntries = journalEntries.map((entry) => ({
        ...entry,
        contentJson: entry.contentJson
          ? decryptJson(entry.contentJson as string)
          : null,
        contentText: decrypt(entry.contentText || null),
        title: decrypt(entry.title || null),
      }));

      // Decrypt map data (nodes, edges, title, etc.)
      const decryptedMap = decryptMapData({
        nodes: map.nodes as any,
        edges: map.edges as any,
        title: map.title,
        sidebarImpressions: map.sidebarImpressions as any,
      });

      // Map data fetched successfully
      return res.status(200).json({
        ...map,
        nodes: decryptedMap.nodes,
        edges: decryptedMap.edges,
        title: decryptedMap.title,
        sidebarImpressions: decryptedMap.sidebarImpressions,
        journalEntries: decryptedJournalEntries,
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch map" });
    }
  }

  if (req.method === "POST" || req.method === "PUT") {
    try {
      // Verify map ownership before allowing update
      const existingMap = await prisma.map.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingMap) {
        return res.status(404).json({ error: "Map not found" });
      }

      if (existingMap.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You don't have permission to update this map" });
      }

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

      // Encrypt sensitive data in map (nodes, title, sidebarImpressions)
      const encryptedMapData = encryptMapData({
        nodes: body.nodes,
        edges: body.edges,
        title: body.title,
        sidebarImpressions: sidebarImpressionsData,
      });

      await prisma.map.update({
        where: { id },
        data: {
          nodes: encryptedMapData.nodes,
          edges: encryptedMapData.edges,
          title: encryptedMapData.title,
          sidebarImpressions: encryptedMapData.sidebarImpressions,
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Update failed" });
    }
  }

  if (req.method === "DELETE") {
    try {
      // Verify map ownership before allowing delete
      const existingMap = await prisma.map.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!existingMap) {
        return res.status(404).json({ error: "Map not found" });
      }

      if (existingMap.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You don't have permission to delete this map" });
      }

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
