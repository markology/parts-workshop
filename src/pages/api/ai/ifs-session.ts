import type { NextApiRequest, NextApiResponse } from "next";
import { runIfsTurnStream } from "@/lib/aiSession";
// import { applyPatch } from "@/server/applyPatch"; // we'll stub first

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  
  try {
    const { userMessage, mapContext } = req.body;
    
    // Set up streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Create a readable stream
    const stream = await runIfsTurnStream({ userMessage, mapContext });
    
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
    console.error("API Error:", e);
    res.status(500).json({ error: e.message });
  }
}