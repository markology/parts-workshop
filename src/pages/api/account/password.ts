import { getServerSession } from "next-auth/next";
import type { NextApiRequest, NextApiResponse } from "next";
import { compare, hash } from "bcryptjs";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!newPassword || newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "New password must be at least 8 characters" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ error: "Current password is required to change password" });
      }

      const isValid = await compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      const isSamePassword = await compare(newPassword, user.passwordHash);
      if (isSamePassword) {
        return res
          .status(400)
          .json({ error: "New password must be different from current" });
      }
    }

    const hashed = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: hashed },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to update password", error);
    return res.status(500).json({ error: "Failed to update password" });
  }
}




