-- AlterTable
ALTER TABLE "Advisor" ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "state" TEXT;

-- CreateIndex
CREATE INDEX "Advisor_state_idx" ON "Advisor"("state");
