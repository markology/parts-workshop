import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getServerSession, type Session } from "next-auth";
import authOptions from "../../auth/[...nextauth]";
import { normalizeJournalType } from "@/features/workspace/utils/journalType";
import { encrypt, encryptJson, decrypt, decryptJson } from "@/lib/encryption";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session: Session | null = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { partId } = req.query;

  if (!partId || typeof partId !== "string") {
    return res.status(400).json({ error: "Part ID is required" });
  }

  try {
    switch (req.method) {
      case "GET":
        // Get all journal entries for a specific part
        const journalEntries = await prisma.journalEntry.findMany({
          where: {
            partId: partId,
            userId: session.user.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Decrypt sensitive fields
        const decryptedEntries = journalEntries.map((entry) => ({
          ...entry,
          contentJson: entry.contentJson
            ? decryptJson(entry.contentJson as string)
            : null,
          contentText: decrypt(entry.contentText || null),
          title: decrypt(entry.title || null),
        }));

        return res.status(200).json(decryptedEntries);

      case "POST":
        // Create a new journal entry for a part
        const { title: postTitle, contentJson: postContentJson, contentText: postContentText, journalType: postJournalType } = req.body;

        if (!postContentJson || typeof postContentJson !== "string") {
          return res.status(400).json({ error: "contentJson is required (string)" });
        }

        // Parse and validate JSON
        let parsedJson: any;
        try {
          parsedJson = JSON.parse(postContentJson);
        } catch (error) {
          return res.status(400).json({ error: "contentJson must be valid JSON string" });
        }

        // Extract text if not provided
        let finalContentText = postContentText;
        if (!finalContentText && parsedJson?.root?.children) {
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
        const validPostJournalType = normalizeJournalType(postJournalType);

        // Verify the part belongs to the user
        const part = await prisma.part.findFirst({
          where: {
            id: partId,
            userId: session.user.id,
          },
        });

        if (!part) {
          return res.status(404).json({ error: "Part not found" });
        }

        // Encrypt sensitive data before saving
        const encryptedContentJson = encryptJson(parsedJson);
        const encryptedContentText = encrypt(finalContentText || "");
        const encryptedTitle = encrypt(postTitle || `Journal Entry - ${part.name}`);

        const newEntry = await prisma.journalEntry.create({
          data: {
            title: encryptedTitle,
            contentJson: encryptedContentJson as any,
            contentText: encryptedContentText,
            journalType: validPostJournalType,
            partId: partId,
            userId: session.user.id,
          },
        });

        // Decrypt for response
        return res.status(201).json({
          ...newEntry,
          contentJson: decryptJson(newEntry.contentJson as string),
          contentText: decrypt(newEntry.contentText || null),
          title: decrypt(newEntry.title || null),
        });

      case "PUT":
        // Update an existing journal entry
        const { entryId, title: updateTitle, contentJson: putContentJson, contentText: putContentText, journalType: putJournalType } = req.body;

        if (!entryId) {
          return res.status(400).json({ error: "Entry ID is required" });
        }

        if (!putContentJson || typeof putContentJson !== "string") {
          return res.status(400).json({ error: "contentJson is required (string)" });
        }

        // Parse and validate JSON
        let parsedUpdateJson: any;
        try {
          parsedUpdateJson = JSON.parse(putContentJson);
        } catch (error) {
          return res.status(400).json({ error: "contentJson must be valid JSON string" });
        }

        // Extract text if not provided
        let finalUpdateContentText = putContentText;
        if (!finalUpdateContentText && parsedUpdateJson?.root?.children) {
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
          finalUpdateContentText = extractTextFromNodes(parsedUpdateJson.root.children);
        }

        // Verify the entry belongs to the user and part
        const existingEntry = await prisma.journalEntry.findFirst({
          where: {
            id: entryId,
            partId: partId,
            userId: session.user.id,
          },
        });

        if (!existingEntry) {
          return res.status(404).json({ error: "Journal entry not found" });
        }

        // Validate journalType if provided
        const validPutJournalType = normalizeJournalType(putJournalType);

        // Encrypt sensitive data before saving
        const encryptedUpdateContentJson = encryptJson(parsedUpdateJson);
        const encryptedUpdateContentText = encrypt(finalUpdateContentText || "");
        const encryptedUpdateTitle = updateTitle ? encrypt(updateTitle) : undefined;

        const updatedEntry = await prisma.journalEntry.update({
          where: {
            id: entryId,
          },
          data: {
            title: encryptedUpdateTitle,
            contentJson: encryptedUpdateContentJson as any,
            contentText: encryptedUpdateContentText,
            journalType: validPutJournalType,
          },
        });

        // Decrypt for response
        return res.status(200).json({
          ...updatedEntry,
          contentJson: decryptJson(updatedEntry.contentJson as string),
          contentText: decrypt(updatedEntry.contentText || null),
          title: decrypt(updatedEntry.title || null),
        });

      case "DELETE":
        // Delete a journal entry
        const { entryId: deleteEntryId } = req.body;

        if (!deleteEntryId) {
          return res.status(400).json({ error: "Entry ID is required" });
        }

        // Verify the entry belongs to the user and part
        const entryToDelete = await prisma.journalEntry.findFirst({
          where: {
            id: deleteEntryId,
            partId: partId,
            userId: session.user.id,
          },
        });

        if (!entryToDelete) {
          return res.status(404).json({ error: "Journal entry not found" });
        }

        await prisma.journalEntry.delete({
          where: {
            id: deleteEntryId,
          },
        });

        return res.status(200).json({ message: "Journal entry deleted successfully" });

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Journal API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
