-- AlterTable
-- Add new JSON-first storage fields for Lexical editor content
ALTER TABLE "JournalEntry" ADD COLUMN "contentJson" JSONB,
ADD COLUMN "contentText" TEXT,
ADD COLUMN "contentHtml" TEXT,
ADD COLUMN "contentVersion" INTEGER NOT NULL DEFAULT 1;

-- Make old content field nullable (deprecated, kept for migration compatibility)
ALTER TABLE "JournalEntry" ALTER COLUMN "content" DROP NOT NULL;

-- CreateIndex for text search
CREATE INDEX "JournalEntry_contentText_idx" ON "JournalEntry"("contentText");

