// pages/api/maps/save.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).end();
  const userId = session.user.id;

  const chunks: Buffer[] = [];

  req.on("data", (chunk) => {
    chunks.push(chunk);
  });

  req.on("end", async () => {
    try {
      const body = Buffer.concat(chunks).toString("utf8");
      const { mapId, nodes, edges, sidebarImpressions, journalEntries } =
        JSON.parse(body);

      if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        return res
          .status(400)
          .json({ error: "Invalid payload: nodes or edges missing" });
      }

      // ✅ Save Map visual state
      await prisma.map.update({
        where: { id: mapId },
        data: {
          nodes,
          edges,
          sidebarImpressions,
        },
      });

      // ✅ Save Journal Entries if provided
      if (Array.isArray(journalEntries)) {
        for (const entry of journalEntries) {
          // Accept either contentJson (preferred) or content (legacy)
          const contentJson = entry.contentJson || entry.content;
          if (!contentJson || (typeof contentJson === "string" && contentJson.trim() === "")) {
            continue;
          }

          // Parse JSON if it's a string, otherwise use as-is
          let parsedJson: any;
          let contentText: string = "";

          if (typeof contentJson === "string") {
            try {
              parsedJson = JSON.parse(contentJson);
            } catch (error) {
              // If parsing fails, might be legacy HTML - skip for now or handle migration
              console.warn("Maps save: Invalid JSON in journal entry, skipping", error);
              continue;
            }
          } else {
            parsedJson = contentJson;
          }

          // Extract text if available
          if (entry.contentText) {
            contentText = entry.contentText;
          } else if (parsedJson?.root?.children) {
            const extractTextFromNodes = (nodes: any[]): string => {
              let text = "";
              for (const node of nodes) {
                if (node.type === "text") {
                  text += node.text || "";
                } else if (node.children) {
                  text += extractTextFromNodes(node.children);
                }
              }
              return text;
            };
            contentText = extractTextFromNodes(parsedJson.root.children);
          }

          // First try to find an existing entry
          const existingEntry = await prisma.journalEntry.findFirst({
            where: {
              userId,
              nodeId: entry.nodeId ?? null, // null = global
            },
          });

          if (existingEntry) {
            // Update if found
            await prisma.journalEntry.update({
              where: { id: existingEntry.id },
              data: {
                contentJson: parsedJson,
                contentText: contentText,
                updatedAt: new Date(),
              },
            });
          } else {
            // Create if not found
            await prisma.journalEntry.create({
              data: {
                userId,
                nodeId: entry.nodeId ?? null,
                contentJson: parsedJson,
                contentText: contentText,
              },
            });
          }
        }
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error("❌ Save error:", err);
      res.status(500).json({ error: "Save failed" });
    }
  });
}
