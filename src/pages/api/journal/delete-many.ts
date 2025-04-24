import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const result = await prisma.journalEntry.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id, // protect against cross-user deletion
      },
    });

    return res.status(200).json({ deleted: result.count });
  } catch (error) {
    console.error("Failed to delete journal entries:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
