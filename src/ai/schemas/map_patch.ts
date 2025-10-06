import { z } from "zod";

export const RelationshipType = z.enum(["COMPATIBILITY","TENSION","NEUTRAL"]);
export const NodeKind = z.enum(["PART","IMPRESSION","RELATIONSHIP"]);

const PartZ = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["MANAGER","FIREFIGHTER","EXILE","CUSTOM"]).optional()
});

const ImpressionZ = z.object({
  canonical: z.enum(["THOUGHT","EMOTION","SENSATION","BEHAVIOR","IDENTITY","CONTEXT","OTHER"]),
  customLabel: z.string().optional()
});

const NodeUpsertZ = z.object({
  id: z.string().min(1),
  kind: NodeKind,
  part: PartZ.optional(),
  impression: ImpressionZ.optional()
});

export const MapPatchZ = z.object({
  schemaVersion: z.literal("1.0.0"),
  ops: z.array(z.discriminatedUnion("op", [
    z.object({ op: z.literal("upsert_node"), node: NodeUpsertZ }),
    z.object({ op: z.literal("delete_node"), nodeId: z.string() }),
    z.object({ op: z.literal("create_relationship"),
      relationship: z.object({
        id: z.string(),
        type: RelationshipType,
        memberNodeIds: z.array(z.string()).min(2),
        weight: z.number().int().min(1).max(5).optional(),
        note: z.string().optional()
      })
    }),
    z.object({ op: z.literal("add_members"),
      relNodeId: z.string(),
      memberNodeIds: z.array(z.string()).min(1)
    }),
    z.object({ op: z.literal("remove_members"),
      relNodeId: z.string(),
      memberNodeIds: z.array(z.string()).min(1)
    }),
    z.object({ op: z.literal("link_journal"),
      entry: z.object({
        nodeId: z.string(),
        title: z.string().optional(),
        content: z.any()
      })
    })
  ]))
});
