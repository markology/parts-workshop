import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { decrypt, decryptJson } from "@/lib/encryption";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).end();

  const userId = session.user.id;

  const entries = await prisma.journalEntry.findMany({
    where: { userId },
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

  res.status(200).json(decryptedEntries);
}
