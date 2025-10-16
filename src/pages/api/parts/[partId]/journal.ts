import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
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

        return res.status(200).json(journalEntries);

      case "POST":
        // Create a new journal entry for a part
        const { title, content } = req.body;

        if (!content || content.trim().length === 0) {
          return res.status(400).json({ error: "Content is required" });
        }

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

        const newEntry = await prisma.journalEntry.create({
          data: {
            title: title || `Journal Entry - ${part.name}`,
            content: content,
            partId: partId,
            userId: session.user.id,
          },
        });

        return res.status(201).json(newEntry);

      case "PUT":
        // Update an existing journal entry
        const { entryId, title: updateTitle, content: updateContent } = req.body;

        if (!entryId) {
          return res.status(400).json({ error: "Entry ID is required" });
        }

        if (!updateContent || updateContent.trim().length === 0) {
          return res.status(400).json({ error: "Content is required" });
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

        const updatedEntry = await prisma.journalEntry.update({
          where: {
            id: entryId,
          },
          data: {
            title: updateTitle,
            content: updateContent,
          },
        });

        return res.status(200).json(updatedEntry);

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
