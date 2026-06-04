-- AlterTable
ALTER TABLE "Advisor" ADD COLUMN     "dealerAuthorizedAt" TIMESTAMP(3),
ADD COLUMN     "isAuthorizedDealer" BOOLEAN NOT NULL DEFAULT false;
