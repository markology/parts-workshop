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
  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!entry || entry.userId !== userId) return res.status(404).end();
    return res.json(entry);
  }

  if (req.method === "PUT") {
    const { content } = req.body;
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: { content },
    });
    return res.json(entry);
  }

  if (req.method === "DELETE") {
    await prisma.journalEntry.delete({
      where: { id },
    });
    return res.status(204).end();
  }

  res.status(405).end();
}
