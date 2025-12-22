import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { join } from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  
  try {
    const { journalContent } = req.body;
    
    if (!journalContent || journalContent.trim().length === 0) {
      return res.status(400).json({ error: "Journal content is required" });
    }
    
    // Load the journal analysis prompt
    const promptPath = join(process.cwd(), "src", "ai", "prompts", "journal_analysis.md");
    const systemPrompt = readFileSync(promptPath, "utf-8");
    
    // Set up streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please analyze this journal entry for IFS insights:\n\n${journalContent}`
        }
      ],
      stream: true,
    });
    
    // Stream the response chunks
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(content);
        // Force flush the response to prevent buffering
        if ('flush' in res && typeof res.flush === 'function') {
          res.flush();
        }
      }
    }
    
    res.end();
  } catch (e: any) {
    console.error("Journal Analysis API Error:", e);
    res.status(500).json({ error: e.message });
  }
}
