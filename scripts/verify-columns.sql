-- Run this in Neon SQL Editor to verify Campaign table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'Campaign' 
ORDER BY ordinal_position;
