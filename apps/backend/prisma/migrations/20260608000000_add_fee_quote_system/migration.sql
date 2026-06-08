-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('REQUESTED', 'QUOTED', 'VIEWED', 'ACCEPTED', 'CANCELLED', 'EXPIRED');

-- AlterTable: add type + refId columns to Notification (safe defaults)
ALTER TABLE "Notification" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "Notification" ADD COLUMN "refId" TEXT;

-- AddIndex on Notification
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- AddForeignKey for Notification.userId -> User.id (cascade delete)
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: FeeQuote
CREATE TABLE "FeeQuote" (
    "id"            TEXT NOT NULL,
    "clientId"      TEXT NOT NULL,
    "advisorId"     TEXT NOT NULL,
    "categorySlug"  TEXT,
    "clientMessage" TEXT,
    "status"        "QuoteStatus" NOT NULL DEFAULT 'REQUESTED',
    "advisorNote"   TEXT,
    "validUntil"    TIMESTAMP(3),
    "totalAmount"   DECIMAL(10,2),
    "viewedAt"      TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FeeQuoteLineItem
CREATE TABLE "FeeQuoteLineItem" (
    "id"          TEXT NOT NULL,
    "quoteId"     TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount"      DECIMAL(10,2) NOT NULL,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FeeQuoteLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeeQuote_clientId_idx"  ON "FeeQuote"("clientId");
CREATE INDEX "FeeQuote_advisorId_idx" ON "FeeQuote"("advisorId");
CREATE INDEX "FeeQuote_status_idx"    ON "FeeQuote"("status");
CREATE INDEX "FeeQuoteLineItem_quoteId_idx" ON "FeeQuoteLineItem"("quoteId");

-- AddForeignKey
ALTER TABLE "FeeQuote" ADD CONSTRAINT "FeeQuote_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FeeQuote" ADD CONSTRAINT "FeeQuote_advisorId_fkey"
  FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FeeQuoteLineItem" ADD CONSTRAINT "FeeQuoteLineItem_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "FeeQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
