// import { getServerSession } from "next-auth/next";
// // import { authOptions } from "../auth/[...nextauth]";
// import { prisma } from "@/lib/prisma";
// import type { NextApiRequest, NextApiResponse } from "next";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const session = await getServerSession(req, res, authOptions);
//   if (!session?.user?.email) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   const user = await prisma.user.findUnique({
//     where: { email: session.user.email },
//   });

//   if (!user) return res.status(404).json({ message: "User not found" });

//   if (req.method === "GET") {
//     const parts = await prisma.part.findMany({ where: { ownerId: user.id } });
//     return res.json(parts);
//   }

//   if (req.method === "POST") {
//     const { name } = req.body;
//     const part = await prisma.part.create({
//       data: { name, ownerId: user.id },
//     });
//     return res.status(201).json(part);
//   }

//   res.setHeader("Allow", ["GET", "POST"]);
//   res.status(405).end(`Method ${req.method} Not Allowed`);
// }
