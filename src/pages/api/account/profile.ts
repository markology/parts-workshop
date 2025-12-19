import { getServerSession } from "next-auth/next";
import type { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { email, name } = req.body as { email?: string; name?: string };

  const updatedData: Record<string, string | null> = {};

  if (typeof name === "string") {
    updatedData.name = name.trim();
  }

  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        NOT: { id: session.user.id },
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    updatedData.email = normalizedEmail;
  }

  if (Object.keys(updatedData).length === 0) {
    return res
      .status(400)
      .json({ error: "Nothing to update. Provide email or name." });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updatedData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Failed to update profile", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}






