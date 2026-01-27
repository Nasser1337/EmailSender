-- Add follow-up columns to existing Campaign table
-- Run this in Neon SQL Editor

ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "followUpSubjectNl" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "followUpSubjectFr" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "followUpBodyNl" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "followUpBodyFr" TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Campaign' 
ORDER BY ordinal_position;
