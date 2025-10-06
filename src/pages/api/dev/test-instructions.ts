import { getIfsInstructions } from "@/lib/instructionsLoader";

/**
 * Development utility to test instructions loading
 * Usage: GET /api/dev/test-instructions
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const instructions = await getIfsInstructions();
    
    res.status(200).json({
      success: true,
      instructions: instructions,
      length: instructions.length,
      message: "Instructions loaded successfully"
    });
  } catch (error) {
    console.error("Error loading instructions:", error);
    res.status(500).json({
      error: "Failed to load instructions",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
