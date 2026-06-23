-- Add pushToken to User and Advisor tables (safe: IF NOT EXISTS for idempotency)
ALTER TABLE "User"    ADD COLUMN IF NOT EXISTS "pushToken" TEXT;
ALTER TABLE "Advisor" ADD COLUMN IF NOT EXISTS "pushToken" TEXT;
