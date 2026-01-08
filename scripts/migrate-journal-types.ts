/**
 * Migration script to update all journal entries with journalType
 * based on their contentJson structure.
 *
 * Run with: npx tsx scripts/migrate-journal-types.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Detects journal type from contentJson
 * - If it's an array, it's a textThread
 * - If it has a "root" property, it's Lexical JSON (normal mode)
 * - Otherwise, defaults to "normal"
 */
function detectJournalType(contentJson: any): "normal" | "textThread" {
  if (!contentJson) return "normal";

  try {
    // If contentJson is already parsed, use it directly
    const parsed =
      typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;

    // If it's an array, it's a textThread
    if (Array.isArray(parsed)) {
      return "textThread";
    }

    // If it has a "root" property, it's Lexical JSON (normal mode)
    if (parsed && typeof parsed === "object" && "root" in parsed) {
      return "normal";
    }
  } catch {
    // Not valid JSON, assume normal journal
  }

  return "normal";
}

async function migrateJournalTypes() {
  console.log("Starting journal type migration...");

  try {
    // Find all journal entries where journalType is null or undefined
    const entries = await prisma.journalEntry.findMany({
      where: {
        OR: [
          { journalType: null },
          { journalType: { not: { in: ["normal", "textThread"] } } },
        ],
      },
      select: {
        id: true,
        contentJson: true,
        journalType: true,
      },
    });

    console.log(`Found ${entries.length} entries to migrate`);

    let updated = 0;
    let skipped = 0;

    for (const entry of entries) {
      const detectedType = detectJournalType(entry.contentJson);

      // Only update if the detected type is different from current (or null)
      if (entry.journalType !== detectedType) {
        await prisma.journalEntry.update({
          where: { id: entry.id },
          data: { journalType: detectedType },
        });
        updated++;
      } else {
        skipped++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`- Updated: ${updated} entries`);
    console.log(`- Skipped: ${skipped} entries (already correct)`);
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateJournalTypes()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
