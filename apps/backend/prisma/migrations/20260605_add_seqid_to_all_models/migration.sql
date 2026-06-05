-- Add sequential human-readable IDs to User, Advisor, and AdminUsers
-- seqId is auto-incrementing and unique — used to compute display IDs (BSU-000001, BSA-000001, BSAD-000001)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "seqId" SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_seqId_key" ON "User"("seqId");

ALTER TABLE "Advisor" ADD COLUMN IF NOT EXISTS "seqId" SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS "Advisor_seqId_key" ON "Advisor"("seqId");

ALTER TABLE "AdminUsers" ADD COLUMN IF NOT EXISTS "seqId" SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUsers_seqId_key" ON "AdminUsers"("seqId");
