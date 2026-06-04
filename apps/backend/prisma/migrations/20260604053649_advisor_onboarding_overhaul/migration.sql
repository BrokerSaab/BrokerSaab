/*
  Warnings:

  - Changed the type of `documentType` on the `AdvisorDocument` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AdvisorType" AS ENUM ('REGULAR', 'AUTHORIZED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('AADHAAR_CARD', 'PASSPORT_PHOTO', 'LICENSE_COPY', 'GST_CERTIFICATE', 'DEGREE_CERTIFICATE', 'OTHER');

-- AlterTable
ALTER TABLE "Advisor" ADD COLUMN     "aadhaarHash" TEXT,
ADD COLUMN     "aadhaarLast4" TEXT,
ADD COLUMN     "advisorType" "AdvisorType" NOT NULL DEFAULT 'REGULAR',
ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "licenseNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AdvisorDocument" DROP COLUMN "documentType",
ADD COLUMN     "documentType" "DocumentType" NOT NULL;

-- CreateTable
CREATE TABLE "AdvisorSubscription" (
    "id" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "subscribedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingSession" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "stepLabel" TEXT NOT NULL DEFAULT 'started',
    "formSnapshot" JSONB,
    "advisorId" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorSubscription_razorpayOrderId_key" ON "AdvisorSubscription"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorSubscription_razorpayPaymentId_key" ON "AdvisorSubscription"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "AdvisorSubscription_advisorId_idx" ON "AdvisorSubscription"("advisorId");

-- CreateIndex
CREATE INDEX "AdvisorSubscription_status_idx" ON "AdvisorSubscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSession_phoneNumber_key" ON "OnboardingSession"("phoneNumber");

-- CreateIndex
CREATE INDEX "OnboardingSession_phoneNumber_idx" ON "OnboardingSession"("phoneNumber");

-- CreateIndex
CREATE INDEX "OnboardingSession_currentStep_idx" ON "OnboardingSession"("currentStep");

-- CreateIndex
CREATE INDEX "AdvisorDocument_advisorId_idx" ON "AdvisorDocument"("advisorId");

-- AddForeignKey
ALTER TABLE "AdvisorSubscription" ADD CONSTRAINT "AdvisorSubscription_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
