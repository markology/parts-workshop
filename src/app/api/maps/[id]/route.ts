import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: mapId } = await params;
  const body = await req.json();

  const { nodes, edges, sidebarImpressions } = body;

  const updated = await prisma.map.update({
    where: { id: mapId },
    data: {
      nodes,
      edges,
      sidebarImpressions,
    },
  });

  return Response.json({ success: true, data: updated });
}
