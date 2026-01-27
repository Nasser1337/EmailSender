-- Add follow-up template fields to Campaign table
-- Run this SQL directly in your Neon database console

ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "followUpSubjectNl" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "followUpSubjectFr" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "followUpBodyNl" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "followUpBodyFr" TEXT;
