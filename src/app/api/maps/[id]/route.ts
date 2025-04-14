import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Map } from "@/types/api/map";

export async function PUT(
  req: NextRequest & { body: Map & { mapId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: undefined }), { status: 401 });
  }

  const { nodes, edges, sidebarImpressions, mapId } = req.body;

  const update = await prisma.map.update({
    where: { id: mapId, userId: session.user.id },
    data: {
      nodes,
      edges,
      sidebarImpressions,
    },
  });

  return new Response(JSON.stringify(update), {
    status: 204,
    headers: { "Content-Type": "application/json" },
  });
}
