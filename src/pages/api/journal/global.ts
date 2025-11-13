import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
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

    if (includeHistory) {
      return res.json({
        entries,
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
          content: "",
        },
      });

      return res.json(entry);
    }

    return res.json(entries[0]);
  }

  if (req.method === "POST") {
    const { content, title, entryId, createNewVersion } = req.body ?? {};

    if (typeof content !== "string") {
      return res.status(400).json({ error: "Content is required" });
    }

    const shouldCreateNew = createNewVersion || !entryId;

    if (!shouldCreateNew) {
      const existing = await prisma.journalEntry.findUnique({
        where: { id: entryId },
      });

      if (!existing || existing.userId !== userId || existing.nodeId !== null) {
        return res.status(404).json({ error: "Journal entry not found" });
      }

      const entry = await prisma.journalEntry.update({
        where: { id: entryId },
        data: {
          content,
          title: typeof title === "string" ? title : undefined,
        },
      });

      return res.json(entry);
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId,
        content,
        nodeId: null,
        title: typeof title === "string" ? title : null,
      },
    });

    return res.json(entry);
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
