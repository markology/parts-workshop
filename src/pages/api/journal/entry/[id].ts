import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { encrypt, encryptJson, decrypt, decryptJson } from "@/lib/encryption";
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
    
    // Decrypt sensitive fields
    return res.json({
      ...entry,
      contentJson: entry.contentJson
        ? decryptJson(entry.contentJson as string)
        : null,
      contentText: decrypt(entry.contentText || null),
      title: decrypt(entry.title || null),
    });
  }

  if (req.method === "PUT") {
    // Verify entry ownership before allowing update
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    if (existingEntry.userId !== userId) {
      return res.status(403).json({ error: "Forbidden: You don't have permission to update this entry" });
    }

    const { content } = req.body;
    
    // Encrypt content before saving (legacy field)
    const encryptedContent = encrypt(content);
    
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: { content: encryptedContent },
    });
    
    // Decrypt for response
    return res.json({
      ...entry,
      content: decrypt(entry.content || null),
      contentJson: entry.contentJson
        ? decryptJson(entry.contentJson as string)
        : null,
      contentText: decrypt(entry.contentText || null),
      title: decrypt(entry.title || null),
    });
  }

  if (req.method === "DELETE") {
    // Verify entry ownership before allowing delete
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingEntry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    if (existingEntry.userId !== userId) {
      return res.status(403).json({ error: "Forbidden: You don't have permission to delete this entry" });
    }

    await prisma.journalEntry.delete({
      where: { id },
    });
    return res.status(204).end();
  }

  res.status(405).end();
}
