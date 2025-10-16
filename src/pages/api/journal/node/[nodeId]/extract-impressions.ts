import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

interface ImpressionItem {
  text: string;
  label: string;
}

interface ExtractedImpressions {
  emotions: ImpressionItem[];
  thoughts: ImpressionItem[];
  sensations: ImpressionItem[];
  behaviors: ImpressionItem[];
  others: ImpressionItem[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { nodeId, journalEntryId } = req.body;

    if (!nodeId || !journalEntryId) {
      return res.status(400).json({ error: "Node ID and Journal Entry ID are required" });
    }

    // Get the journal entry
    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        id: journalEntryId,
        nodeId: nodeId,
        userId: session.user.id,
      },
    });

    if (!journalEntry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    // Get the node to get its name for context
    const node = await prisma.map.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        nodes: true,
      },
    });

    if (!node) {
      return res.status(404).json({ error: "Map not found" });
    }

    // Parse the nodes to find the specific node
    const nodes = Array.isArray(node.nodes) ? node.nodes : [];
    const targetNode = nodes.find((n: any) => n.id === nodeId);
    const nodeName = (targetNode as any)?.data?.name || (targetNode as any)?.data?.label || "Unknown";

    // Call the impression extraction API
    const extractionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/extract-impressions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        journalContent: journalEntry.content,
        partName: nodeName,
      }),
    });

    if (!extractionResponse.ok) {
      throw new Error("Failed to extract impressions");
    }

    const extractedImpressions: ExtractedImpressions = await extractionResponse.json();

    // Create impressions in the database
    const createdImpressions: any[] = [];

    // Helper function to create impressions
    const createImpressions = async (impressions: ImpressionItem[], type: string) => {
      for (const impression of impressions) {
        const created = await prisma.impression.create({
          data: {
            label: impression.label,
            type: type,
            userId: session.user.id,
            nodeId: nodeId,
            isNode: true,
            scratchpad: impression.text, // Store the original text
          },
        });
        createdImpressions.push(created);
      }
    };

    // Create impressions for each type
    await createImpressions(extractedImpressions.emotions, "emotion");
    await createImpressions(extractedImpressions.thoughts, "thought");
    await createImpressions(extractedImpressions.sensations, "sensation");
    await createImpressions(extractedImpressions.behaviors, "behavior");
    await createImpressions(extractedImpressions.others, "other");

    return res.status(200).json({
      message: "Impressions extracted and added successfully",
      impressions: createdImpressions,
      summary: {
        emotions: extractedImpressions.emotions.length,
        thoughts: extractedImpressions.thoughts.length,
        sensations: extractedImpressions.sensations.length,
        behaviors: extractedImpressions.behaviors.length,
        others: extractedImpressions.others.length,
        total: createdImpressions.length,
      },
    });
  } catch (error) {
    console.error("Impression Extraction Error:", error);
    return res.status(500).json({ error: "Failed to extract impressions" });
  }
}
