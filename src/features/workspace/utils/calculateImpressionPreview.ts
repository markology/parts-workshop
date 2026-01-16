/**
 * Calculates how many impressions can fit in a limited number of rows
 * based on character count, accounting for the "+X more" pill.
 * 
 * @param observations - Array of impression observations with `data?.label` or `id` property
 * @param options - Configuration options
 * @returns Array of observations that fit within the row limit
 */
export interface ImpressionObservation {
  data?: { label?: string };
  id?: string;
}

export interface CalculateImpressionPreviewOptions {
  maxRows?: number;
  maxCharactersPerRow?: number;
  charactersPerPill?: number;
  morePillTextEstimate?: number;
}

export function calculateImpressionPreview<T extends ImpressionObservation>(
  observations: T[],
  options: CalculateImpressionPreviewOptions = {}
): T[] {
  const {
    maxRows = 4,
    maxCharactersPerRow = 60,
    charactersPerPill = 6,
    morePillTextEstimate = 10,
  } = options;

  let currentRowCharacters = 0;
  let currentRow = 0; // 0-indexed
  const preview: T[] = [];

  // Estimate space needed for "+X more" pill (e.g., "+99 more" = ~10 chars + pill overhead)
  const morePillSpace = morePillTextEstimate + charactersPerPill; // ~16 characters total

  for (let i = 0; i < observations.length; i++) {
    const obs = observations[i];
    // Get the impression label text
    const label = obs.data?.label || obs.id || "";
    // Cap at 60 characters (ellipsis if longer, but count as 60 - takes up 1 full row)
    const textCharCount = Math.min(label.length, 60);
    // Each pill takes up ~6 characters worth of space (padding/spacing)
    // Total space = text length (max 60) + pill overhead (6)
    const totalSpace = textCharCount + charactersPerPill;

    // Check if there will be remaining impressions after this one
    const willHaveRemaining = i < observations.length - 1;
    const isLastRow = currentRow === maxRows - 1; // Last row (0-indexed, so maxRows - 1)

    // If this impression is 60+ chars, it takes up a full row
    if (textCharCount >= 60) {
      // If current row has content, move to next row first
      if (currentRowCharacters > 0) {
        currentRow++;
        currentRowCharacters = 0;
      }
      // Check if we've exceeded max rows
      if (currentRow >= maxRows) {
        break;
      }
      // If this is the last row and there will be remaining impressions,
      // we can't add a long impression that takes the full row (no room for "+X more")
      if (isLastRow && willHaveRemaining) {
        break;
      }
      // This impression takes the full row (60 chars)
      currentRowCharacters = 60;
      preview.push(obs);
      // Move to next row after this one
      currentRow++;
      currentRowCharacters = 0;
      if (currentRow >= maxRows) {
        break;
      }
    } else {
      // Check if this impression would exceed the row limit
      const wouldExceedRow =
        currentRowCharacters + totalSpace > maxCharactersPerRow;

      // If we're on the last row and there will be remaining impressions,
      // we need to ensure there's space for the "+X more" pill
      if (isLastRow && willHaveRemaining) {
        const spaceAfterThis = currentRowCharacters + totalSpace;
        const spaceNeededForMore = spaceAfterThis + morePillSpace;
        if (spaceNeededForMore > maxCharactersPerRow) {
          break;
        }
      }

      if (wouldExceedRow && currentRowCharacters > 0) {
        // Move to next row
        currentRow++;
        currentRowCharacters = 0;
        // Check if we've exceeded max rows
        if (currentRow >= maxRows) {
          break;
        }
        // If we moved to the last row and there will be remaining impressions,
        // check if this impression + "+X more" pill would fit
        if (currentRow === maxRows - 1 && willHaveRemaining) {
          const spaceNeededForMore = totalSpace + morePillSpace;
          if (spaceNeededForMore > maxCharactersPerRow) {
            break;
          }
        }
      }

      // Add this impression to current row
      currentRowCharacters += totalSpace;
      preview.push(obs);
    }
  }

  return preview;
}
