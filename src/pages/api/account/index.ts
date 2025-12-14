import { getServerSession } from "next-auth/next";
import type { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = session.user.id;

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          passwordHash: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt,
          hasPassword: Boolean(user.passwordHash),
        },
      });
    } catch (error) {
      console.error("Failed to load account", error);
      return res.status(500).json({ error: "Failed to load account" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.account.deleteMany({ where: { userId } });
        await tx.map.deleteMany({ where: { userId } });
        await tx.impression.deleteMany({ where: { userId } });
        await tx.journalEntry.deleteMany({ where: { userId } });
        await tx.conflict.deleteMany({ where: { userId } });
        await tx.tag.deleteMany({ where: { userId } });
        await tx.part.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Failed to delete account", error);
      return res.status(500).json({ error: "Failed to delete account" });
    }
  }

  return res.status(405).end();
}




