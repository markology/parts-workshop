/**
 * Utility functions for extracting preview text from journal entries
 */

/**
 * Extract preview from text thread messages
 */
export const extractTextThreadPreview = (
  content: string,
  partNodes: Array<{ id: string; label: string }> = []
): string => {
  if (!content) return "";
  try {
    const messages = JSON.parse(content);
    if (!Array.isArray(messages) || messages.length === 0) {
      return "Empty conversation";
    }
    // Get the last few messages for preview
    const recentMessages = messages.slice(-3);
    return recentMessages
      .map((msg: any) => {
        let speaker = "Unknown";
        if (msg.speakerId === "self") {
          speaker = "Self";
        } else if (msg.speakerId === "unknown" || msg.speakerId === "?") {
          speaker = "Unknown";
        } else {
          // Look up part label by ID
          const part = partNodes.find((p) => p.id === msg.speakerId);
          speaker = part?.label || "Part";
        }
        const text = msg.text || "";
        return `${speaker}: ${text}`;
      })
      .join(" • ");
  } catch {
    return "";
  }
};

/**
 * Extract plain text from journal content
 * - For textThread type: extracts preview from messages
 * - For normal type: extracts text from HTML/Lexical content
 */
export const extractPlainText = (
  content: string,
  partNodes: Array<{ id: string; label: string }> = [],
  journalType?: "normal" | "textThread" | null
) => {
  if (!content) return "";

  // Use journalType if provided, otherwise default to normal (legacy entries)
  if (journalType === "textThread") {
    return extractTextThreadPreview(content, partNodes);
  }

  // Otherwise treat as HTML and extract text
  let text = "";
  if (typeof window === "undefined") {
    text = content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } else {
    const temp = document.createElement("div");
    temp.innerHTML = content;
    text = (temp.textContent || temp.innerText || "").trim();
  }

  // Return a snippet (first 150 characters)
  if (text.length > 150) {
    return text.slice(0, 150) + "...";
  }
  return text;
};

