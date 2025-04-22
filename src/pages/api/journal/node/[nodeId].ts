import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).end();

  const userId = session.user.id;
  const nodeId = req.query.nodeId as string;

  if (!nodeId) return res.status(400).json({ error: "Missing nodeId" });

  if (req.method === "GET") {
    let entry = await prisma.journalEntry.findFirst({
      where: { userId, nodeId },
    });

    if (!entry) {
      entry = await prisma.journalEntry.create({
        data: {
          userId,
          nodeId,
          content: "", // default empty content
        },
      });
    }

    return res.json(entry);
  }
  if (req.method === "POST") {
    const { content } = req.body;

    const existing = await prisma.journalEntry.findFirst({
      where: { userId, nodeId },
    });

    const entry = existing
      ? await prisma.journalEntry.update({
          where: { id: existing.id },
          data: { content },
        })
      : await prisma.journalEntry.create({
          data: { userId, nodeId, content },
        });

    return res.json(entry);
  }

  return res.status(405).end();
}
