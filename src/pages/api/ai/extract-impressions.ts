import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { join } from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  
  try {
    const { journalContent, partName } = req.body;
    
    if (!journalContent || journalContent.trim().length === 0) {
      return res.status(400).json({ error: "Journal content is required" });
    }
    
    // Load the impression extraction prompt
    const promptPath = join(process.cwd(), "src", "ai", "prompts", "impression_extraction.md");
    const systemPrompt = readFileSync(promptPath, "utf-8");
    
    // Create the user message with context about the part
    const userMessage = partName 
      ? `Please extract impressions from this journal entry written about the part "${partName}":\n\n${journalContent}`
      : `Please extract impressions from this journal entry:\n\n${journalContent}`;
    
    // Get AI response
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }
    
    // Parse the JSON response
    let extractedImpressions: ExtractedImpressions;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      extractedImpressions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }
    
    // Validate the response structure
    if (!extractedImpressions || typeof extractedImpressions !== 'object') {
      throw new Error("Invalid response structure");
    }
    
    // Ensure all arrays exist
    const validatedImpressions: ExtractedImpressions = {
      emotions: Array.isArray(extractedImpressions.emotions) ? extractedImpressions.emotions : [],
      thoughts: Array.isArray(extractedImpressions.thoughts) ? extractedImpressions.thoughts : [],
      sensations: Array.isArray(extractedImpressions.sensations) ? extractedImpressions.sensations : [],
      behaviors: Array.isArray(extractedImpressions.behaviors) ? extractedImpressions.behaviors : [],
      others: Array.isArray(extractedImpressions.others) ? extractedImpressions.others : [],
    };
    
    res.status(200).json(validatedImpressions);
  } catch (e: any) {
    console.error("Impression Extraction API Error:", e);
    res.status(500).json({ error: e.message });
  }
}
