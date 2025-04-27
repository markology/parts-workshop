/**
 * Deletes journal entries whose nodeId does not exist in the current map.
 *
 * @param currentNodeIds - An array of node IDs currently in the loaded map.
 */
export async function cleanupOrphanedJournalEntriesFromMap(
  currentNodeIds: string[]
) {
  try {
    const res = await fetch("/api/journal/all");
    if (!res.ok) throw new Error("Failed to fetch journal entries");

    const allEntries: { id: string; nodeId?: string | null }[] =
      await res.json();

    const nodeIdSet = new Set(currentNodeIds);

    const orphanedIds = allEntries
      .filter((entry) => entry.nodeId && !nodeIdSet.has(entry.nodeId))
      .map((entry) => entry.id);

    if (orphanedIds.length === 0) {
      console.log("✅ No orphaned journal entries found.");
      return;
    }

    const deleteRes = await fetch("/api/journal/delete-many", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: orphanedIds }),
    });

    if (!deleteRes.ok)
      throw new Error("Failed to delete orphaned journal entries");

    const { deleted } = await deleteRes.json();
    console.log(`🧹 Cleaned up ${deleted} orphaned journal entries.`);
  } catch (error) {
    console.error("❌ Orphan cleanup failed:", error);
  }
}
