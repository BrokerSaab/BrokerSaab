-- Add isActive column to AdminUsers (missed from initial schema)
ALTER TABLE "AdminUsers" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
