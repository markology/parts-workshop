/**
 * Extracts AI-ready text from journal entries
 * 
 * This function converts Lexical JSON to plain text optimized for AI processing.
 * It preserves semantic information (like speaker labels) while removing formatting.
 * 
 * @param contentJson - Lexical JSON string or object
 * @param options - Configuration options
 * @returns Plain text optimized for AI analysis
 */
export function extractAiText(
  contentJson: string | object | null | undefined,
  options: {
    includeSpeakers?: boolean;
    speakerLabels?: Map<string, string>; // Map of speakerId -> label
  } = {}
): string {
  if (!contentJson) return "";

  // Parse JSON if it's a string
  let parsed: any;
  try {
    parsed = typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;
  } catch {
    return "";
  }

  // Handle text thread format (array of messages)
  if (Array.isArray(parsed)) {
    return parsed
      .map((msg: any) => {
        const speaker = options.includeSpeakers && msg.speakerId
          ? getSpeakerLabel(msg.speakerId, options.speakerLabels) + ": "
          : "";
        return speaker + (msg.text || "");
      })
      .join("\n");
  }

  // Handle Lexical JSON format
  if (parsed.root && parsed.root.children) {
    return extractTextFromLexicalNodes(parsed.root.children, options);
  }

  return "";
}

/**
 * Recursively extracts text from Lexical nodes
 */
function extractTextFromLexicalNodes(
  nodes: any[],
  options: {
    includeSpeakers?: boolean;
    speakerLabels?: Map<string, string>;
  }
): string {
  const parts: string[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      parts.push(node.text || "");
    } else if (node.type === "speaker-line" && options.includeSpeakers) {
      // Handle custom SpeakerLineNode
      const speakerId = node.speakerId;
      const speakerLabel = speakerId
        ? getSpeakerLabel(speakerId, options.speakerLabels) + ": "
        : "";
      
      // Get text from children
      const childrenText = node.children
        ? extractTextFromLexicalNodes(node.children, options)
        : "";
      
      if (childrenText) {
        parts.push(speakerLabel + childrenText);
      }
    } else if (node.children) {
      // Recursively process child nodes
      const childText = extractTextFromLexicalNodes(node.children, options);
      if (childText) {
        parts.push(childText);
      }
    }
  }

  return parts.join(" ").trim();
}

/**
 * Gets speaker label from ID
 */
function getSpeakerLabel(
  speakerId: string,
  speakerLabels?: Map<string, string>
): string {
  if (!speakerLabels) {
    // Default labels
    if (speakerId === "self") return "Self";
    if (speakerId === "unknown" || speakerId === "?") return "Unknown";
    return `Part ${speakerId.slice(0, 8)}`;
  }

  return speakerLabels.get(speakerId) || speakerId;
}

/**
 * Alternative: Use contentText directly (simplest, recommended for most cases)
 * 
 * This is the fastest option - just use the pre-computed contentText field.
 * Only use extractAiText() if you need to include speaker information.
 */
export function getAiTextSimple(
  contentText: string | null | undefined
): string {
  return contentText || "";
}

