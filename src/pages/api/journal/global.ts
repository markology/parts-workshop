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

  if (req.method === "GET") {
    const entry = await prisma.journalEntry.findFirst({
      where: { userId, nodeId: null },
    });
    return res.json(entry);
  }

  if (req.method === "POST" || req.method === "PUT") {
    const { content } = req.body;
    const existing = await prisma.journalEntry.findFirst({
      where: { userId, nodeId: null },
    });

    const entry = existing
      ? await prisma.journalEntry.update({
          where: { id: existing.id },
          data: { content },
        })
      : await prisma.journalEntry.create({
          data: { userId, content },
        });

    return res.json(entry);
  }

  res.status(405).end();
}
