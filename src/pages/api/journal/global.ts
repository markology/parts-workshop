import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { normalizeJournalType } from "@/features/workspace/utils/journalType";
import { encrypt, encryptJson, decrypt, decryptJson } from "@/lib/encryption";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).end();

  const userId = session.user.id;

  if (req.method === "GET") {
    const includeHistory =
      req.query.history === "true" || req.query.history === "1";
    const entries = await prisma.journalEntry.findMany({
      where: { userId, nodeId: null },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Decrypt sensitive fields
    const decryptedEntries = entries.map((entry) => ({
      ...entry,
      contentJson: entry.contentJson
        ? decryptJson(entry.contentJson as string)
        : null,
      contentText: decrypt(entry.contentText || null),
      title: decrypt(entry.title || null),
    }));

    if (includeHistory) {
      return res.json({
        entries: decryptedEntries,
      });
    }

    if (entries.length === 0) {
      const shouldCreate =
        req.query.createIfMissing !== "false" &&
        req.query.createIfMissing !== "0";

      if (!shouldCreate) {
        return res.status(404).json({ error: "No journal entries found" });
      }

      const entry = await prisma.journalEntry.create({
        data: {
          userId,
          contentJson: undefined,
          contentText: "",
          journalType: "normal", // Default to normal journal type
        },
      });

      return res.json({
        ...entry,
        contentJson: null,
        contentText: "",
        title: null,
      });
    }

    return res.json(decryptedEntries[0]);
  }

  if (req.method === "POST") {
    // Accept contentJson (required) and contentText (optional, computed if missing)
    const { contentJson, contentText, title, entryId, createNewVersion, journalType, speakers } = req.body ?? {};

    if (typeof contentJson !== "string") {
      return res.status(400).json({ error: "contentJson is required (string)" });
    }

    // Parse contentJson to validate it's valid JSON and extract text if contentText not provided
    let parsedJson: any;
    try {
      parsedJson = JSON.parse(contentJson);
    } catch (error) {
      return res.status(400).json({ error: "contentJson must be valid JSON string" });
    }

    // Use provided contentText or extract from JSON (fallback)
    let finalContentText = contentText;
    if (!finalContentText && parsedJson?.root?.children) {
      // Basic text extraction from Lexical JSON structure
      // This is a fallback; ideally contentText should be provided by client
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
      finalContentText = extractTextFromNodes(parsedJson.root.children);
    }

    // Validate journalType if provided
    const validJournalType = normalizeJournalType(journalType);

    const shouldCreateNew = createNewVersion || !entryId;

    if (!shouldCreateNew) {
      const existing = await prisma.journalEntry.findUnique({
        where: { id: entryId },
      });

      if (!existing || existing.userId !== userId || existing.nodeId !== null) {
        return res.status(404).json({ error: "Journal entry not found" });
      }

      // Encrypt sensitive data before saving
      const encryptedContentJson = encryptJson(parsedJson);
      const encryptedContentText = encrypt(finalContentText || "");
      const encryptedTitle = typeof title === "string" ? encrypt(title) : undefined;

      const entry = await prisma.journalEntry.update({
        where: { id: entryId },
        data: {
          contentJson: encryptedContentJson as any,
          contentText: encryptedContentText,
          title: encryptedTitle,
          journalType: validJournalType,
          speakers: Array.isArray(speakers) ? speakers : undefined,
        },
      });

      // Decrypt for response
      return res.json({
        ...entry,
        contentJson: decryptJson(entry.contentJson as string),
        contentText: decrypt(entry.contentText || null),
        title: decrypt(entry.title || null),
      });
    }

    // Encrypt sensitive data before saving
    const encryptedContentJson = encryptJson(parsedJson);
    const encryptedContentText = encrypt(finalContentText || "");
    const encryptedTitle = typeof title === "string" ? encrypt(title) : null;

    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        contentJson: encryptedContentJson as any,
        contentText: encryptedContentText,
        nodeId: null,
        title: encryptedTitle,
        journalType: validJournalType,
        speakers: Array.isArray(speakers) ? speakers : [],
      },
    });

    // Decrypt for response
    return res.json({
      ...entry,
      contentJson: decryptJson(entry.contentJson as string),
      contentText: decrypt(entry.contentText || null),
      title: decrypt(entry.title || null),
    });
  }

  if (req.method === "DELETE") {
    const entryId =
      (req.query.entryId as string | undefined) ?? req.body?.entryId;

    if (!entryId) {
      await prisma.journalEntry.deleteMany({
        where: { userId, nodeId: null },
      });

      return res.status(204).end();
    }

    const existing = await prisma.journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!existing || existing.userId !== userId || existing.nodeId !== null) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    await prisma.journalEntry.delete({
      where: { id: entryId },
    });

    return res.status(204).end();
  }

  res.status(405).end();
}
