import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getServerSession, type Session } from "next-auth";
import authOptions from "../../auth/[...nextauth]";
import type { Impression } from "@prisma/client";

const prisma = new PrismaClient();

interface ImpressionItem {
  text: string;
  label: string;
  intensity?: "low" | "medium" | "high";
  pattern?: string;
  location?: string;
  category?: string;
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

  const session: Session | null = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { partId, journalEntryId } = req.body;

    if (!partId || !journalEntryId) {
      return res.status(400).json({ error: "Part ID and Journal Entry ID are required" });
    }

    // Get the journal entry
    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        id: journalEntryId,
        partId: partId,
        userId: session.user.id,
      },
    });

    if (!journalEntry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    // Get the part to get its name for context
    const part = await prisma.part.findFirst({
      where: {
        id: partId,
        userId: session.user.id,
      },
    });

    if (!part) {
      return res.status(404).json({ error: "Part not found" });
    }

    // Call the impression extraction API
    const extractionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/extract-impressions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        journalContent: journalEntry.content,
        partName: part.name,
      }),
    });

    if (!extractionResponse.ok) {
      throw new Error("Failed to extract impressions");
    }

    const extractedImpressions: ExtractedImpressions = await extractionResponse.json();

    // Create impressions in the database
    const createdImpressions: Impression[] = [];

    // Helper function to create impressions
    const createImpressions = async (impressions: ImpressionItem[], type: string) => {
      for (const impression of impressions) {
        const created = await prisma.impression.create({
          data: {
            label: impression.label,
            type: type,
            userId: session.user.id,
            partId: partId,
            scratchpad: JSON.stringify({
              originalText: impression.text,
              intensity: impression.intensity,
              pattern: impression.pattern,
              location: impression.location,
              category: impression.category,
              extractedFrom: journalEntryId,
            }),
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
