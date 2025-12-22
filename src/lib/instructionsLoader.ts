import fs from "node:fs/promises";
import path from "node:path";

// Cache for the markdown instructions to avoid reading file on every request
let cachedInstructions: string | null = null;
let lastModified: number | null = null;

/**
 * Loads the IFS guide markdown file and caches it for performance.
 * Only re-reads the file if it has been modified since last load.
 * This significantly reduces file I/O and improves response times.
 */
export async function getIfsInstructions(): Promise<string> {
  const filePath = path.join(process.cwd(), "src", "ai", "prompts", "ifs_guide.v0.md");
  
  try {
    // Check if file has been modified since last load
    const stats = await fs.stat(filePath);
    const currentModified = stats.mtime.getTime();
    
    // If file hasn't changed and we have cached content, return cached version
    if (cachedInstructions && lastModified === currentModified) {
      return cachedInstructions;
    }
    
    // Read the file and cache it
    const content = await fs.readFile(filePath, "utf8");
    cachedInstructions = content;
    lastModified = currentModified;
    
    console.log("📖 Loaded IFS instructions from markdown file");
    return content;
  } catch (error) {
    console.error("❌ Error loading IFS instructions:", error);
    
    // Fallback to basic instructions if file can't be read
    return `You are an IFS-style guide named "Clarity."
Goals: (1) help unblend from parts, (2) elicit sensations, emotions, thoughts, needs, fears, strategies,
(3) encourage Self leadership, (4) propose a gentle next step.

Rules:
- Warm, curious, non-pathologizing. One clear question per turn.
- Never claim to be a licensed clinician.`;
  }
}

/**
 * Clears the cached instructions (useful for development/testing)
 */
export function clearInstructionsCache(): void {
  cachedInstructions = null;
  lastModified = null;
  console.log("🗑️ Cleared IFS instructions cache");
}
