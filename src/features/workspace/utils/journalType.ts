import type { JournalType } from "@/features/workspace/types/Journal";

export type JournalMode = "normal" | "textThread";

export function normalizeJournalType(value: unknown): JournalType | null {
  return value === "normal" || value === "textThread" ? value : null;
}

/**
 * UI helper: derive the editor mode from an entry's journalType.
 * - Defaults to "normal" for legacy / invalid values.
 * - Forces "normal" for impressions regardless of stored value.
 */
export function getJournalModeFromType(
  journalType: unknown,
  options?: { isImpression?: boolean }
): JournalMode {
  const mode = normalizeJournalType(journalType) ?? "normal";
  return options?.isImpression ? "normal" : mode;
}


