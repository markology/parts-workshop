// import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { Map } from "@/types/api/map";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const maps = await prisma.map.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return new Response(JSON.stringify(maps), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest & { body: Map }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: undefined }), { status: 401 });
  }

  const { title, nodes, edges, sidebarImpressions } = req.body;

  const newMap = await prisma.map.create({
    data: {
      userId: session?.user?.id,
      title,
      nodes,
      edges,
      sidebarImpressions,
    },
  });

  return new Response(JSON.stringify(newMap), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
