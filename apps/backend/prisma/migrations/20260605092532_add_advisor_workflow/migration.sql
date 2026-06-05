-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VerificationStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "VerificationStatus" ADD VALUE 'SUBMITTED_FOR_APPROVAL';

-- AlterTable
ALTER TABLE "AdminUsers" ADD COLUMN     "createdByAdminId" TEXT;

-- AlterTable
ALTER TABLE "Advisor" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "assignedSubAdminId" TEXT,
ADD COLUMN     "rejectionComment" TEXT,
ADD COLUMN     "subAdminNote" TEXT;

-- AlterTable
ALTER TABLE "AdvisorDocument" ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedByAdminId" TEXT;

-- AddForeignKey
ALTER TABLE "Advisor" ADD CONSTRAINT "Advisor_assignedSubAdminId_fkey" FOREIGN KEY ("assignedSubAdminId") REFERENCES "AdminUsers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
