-- CreateEnum
CREATE TYPE "LineItemStatus" AS ENUM ('PENDING', 'RELEASED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankAccountHolder" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankAccountType" TEXT DEFAULT 'savings',
ADD COLUMN     "bankIfsc" TEXT,
ADD COLUMN     "razorpayContactId" TEXT,
ADD COLUMN     "razorpayFundAccountId" TEXT;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "stageId" TEXT;

-- AlterTable
ALTER TABLE "FeeQuoteLineItem" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "status" "LineItemStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "TicketStage" ADD COLUMN     "lineItemId" TEXT,
ADD COLUMN     "releaseAmount" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "ClientWithdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "netAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "bankAccount" TEXT NOT NULL,
    "referenceId" TEXT,
    "rejectionReason" TEXT,
    "razorpayPayoutId" TEXT,
    "payoutMode" TEXT,
    "releasedByAdminId" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientWithdrawal_referenceId_key" ON "ClientWithdrawal"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientWithdrawal_razorpayPayoutId_key" ON "ClientWithdrawal"("razorpayPayoutId");

-- CreateIndex
CREATE INDEX "ClientWithdrawal_userId_idx" ON "ClientWithdrawal"("userId");

-- CreateIndex
CREATE INDEX "ClientWithdrawal_status_idx" ON "ClientWithdrawal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_stageId_key" ON "Payout"("stageId");

-- CreateIndex
CREATE INDEX "Payout_ticketId_idx" ON "Payout"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketStage_lineItemId_key" ON "TicketStage"("lineItemId");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "TicketStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientWithdrawal" ADD CONSTRAINT "ClientWithdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketStage" ADD CONSTRAINT "TicketStage_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "FeeQuoteLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

