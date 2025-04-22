-- AlterTable
ALTER TABLE "Impression" ADD COLUMN     "partId" TEXT;

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "conflictId" TEXT,
ADD COLUMN     "nodeId" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE INDEX "JournalEntry_userId_idx" ON "JournalEntry"("userId");

-- CreateIndex
CREATE INDEX "JournalEntry_nodeId_idx" ON "JournalEntry"("nodeId");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "Conflict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impression" ADD CONSTRAINT "Impression_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;
