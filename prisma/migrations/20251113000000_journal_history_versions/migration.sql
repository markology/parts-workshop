-- Drop unique constraint to allow multiple journal entries per node per user
DROP INDEX IF EXISTS "JournalEntry_userId_nodeId_key";

