import { openai } from "@/ai";
import { AI_CONFIG } from "@/ai/config";
import { MapPatchZ } from "@/ai/schemas/map_patch";
import { getIfsInstructions } from "./instructionsLoader";

export async function runIfsTurn(params: {
  userMessage: string;
  mapContext?: any;  // recent node names, last summary, etc. keep small
}) {
  const { userMessage, mapContext } = params;
  
  // Load instructions from markdown file (cached for performance)
  const instructions = await getIfsInstructions();

  console.log('CREATING RESPONSE')
  const resp = await openai.responses.create({
    model: AI_CONFIG.model,
    input: userMessage,
    max_output_tokens: 500,
    text: { format: { type: 'text' }, verbosity: 'low' },
    instructions: instructions,
    reasoning: {effort: 'low'}
  });

  console.log(resp)

  const text = resp.output_text;
  
  return {
    response_text: text as string,
    // map_patch: patch
  };
}

export async function runIfsTurnStream(params: {
  userMessage: string;
  mapContext?: any;
}) {
  const { userMessage, mapContext } = params;
  
  // Load instructions from markdown file (cached for performance)
  const instructions = await getIfsInstructions();

  console.log('CREATING STREAMING RESPONSE')
  
  // Use Chat Completions API for streaming instead of Responses API
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Use a streaming-capable model
    messages: [
      {
        role: "system",
        content: instructions
      },
      {
        role: "user", 
        content: userMessage
      }
    ],
    max_tokens: 500,
    stream: true
  });

  return stream;
}