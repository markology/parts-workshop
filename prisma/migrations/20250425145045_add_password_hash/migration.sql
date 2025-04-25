/*
  Warnings:

  - A unique constraint covering the columns `[userId,nodeId]` on the table `JournalEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_userId_nodeId_key" ON "JournalEntry"("userId", "nodeId");
