-- CreateTable
CREATE TABLE "UserContactSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "creditsTotal" INTEGER NOT NULL DEFAULT 20,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "subscribedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserContactSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactUnlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserContactSubscription_razorpayOrderId_key" ON "UserContactSubscription"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "UserContactSubscription_razorpayPaymentId_key" ON "UserContactSubscription"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "UserContactSubscription_userId_idx" ON "UserContactSubscription"("userId");

-- CreateIndex
CREATE INDEX "UserContactSubscription_status_idx" ON "UserContactSubscription"("status");

-- CreateIndex
CREATE INDEX "UserContactSubscription_expiresAt_idx" ON "UserContactSubscription"("expiresAt");

-- CreateIndex
CREATE INDEX "ContactUnlock_userId_idx" ON "ContactUnlock"("userId");

-- CreateIndex
CREATE INDEX "ContactUnlock_advisorId_idx" ON "ContactUnlock"("advisorId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactUnlock_userId_advisorId_key" ON "ContactUnlock"("userId", "advisorId");

-- AddForeignKey
ALTER TABLE "UserContactSubscription" ADD CONSTRAINT "UserContactSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactUnlock" ADD CONSTRAINT "ContactUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactUnlock" ADD CONSTRAINT "ContactUnlock_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactUnlock" ADD CONSTRAINT "ContactUnlock_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "UserContactSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
