import { clearInstructionsCache } from "@/lib/instructionsLoader";

/**
 * API endpoint to clear the cached IFS instructions.
 * Useful for development when you update the markdown file.
 * 
 * Usage: POST /api/admin/clear-instructions-cache
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    clearInstructionsCache();
    res.status(200).json({ 
      success: true, 
      message: "Instructions cache cleared successfully" 
    });
  } catch (error) {
    console.error("Error clearing instructions cache:", error);
    res.status(500).json({ 
      error: "Failed to clear instructions cache" 
    });
  }
}
