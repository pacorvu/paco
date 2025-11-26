-- ============================================================================
-- RESTORE FOREIGN KEY CONSTRAINT: job_offers.usn -> students.usn
-- ============================================================================
-- This script restores the foreign key relationship between job_offers and students tables
-- Run this if you accidentally deleted the foreign key constraint
-- ============================================================================

-- First, check for any orphaned records (job_offers with usn that don't exist in students)
-- If you have orphaned records, you'll need to either:
-- 1. Delete them, or
-- 2. Add the corresponding student records first

-- Check for orphaned records (uncomment to run):
-- SELECT jo.id, jo.usn, jo.company_name
-- FROM job_offers jo
-- LEFT JOIN students s ON jo.usn = s.usn
-- WHERE s.usn IS NULL;

-- ============================================================================
-- OPTION 1: If you have NO orphaned records, run this:
-- ============================================================================

-- Drop the constraint if it exists (in case you want to recreate it)
ALTER TABLE job_offers 
DROP CONSTRAINT IF EXISTS fk_student_usn;

-- Add the foreign key constraint
ALTER TABLE job_offers
ADD CONSTRAINT fk_student_usn 
FOREIGN KEY (usn) 
REFERENCES students(usn) 
ON DELETE CASCADE;

-- ============================================================================
-- OPTION 2: If you HAVE orphaned records and want to keep them:
-- ============================================================================
-- You can add the constraint with NOT VALID first, then validate it later
-- after cleaning up the data:

-- ALTER TABLE job_offers
-- ADD CONSTRAINT fk_student_usn 
-- FOREIGN KEY (usn) 
-- REFERENCES students(usn) 
-- ON DELETE CASCADE
-- NOT VALID;

-- Then after fixing the data:
-- ALTER TABLE job_offers VALIDATE CONSTRAINT fk_student_usn;

-- ============================================================================
-- OPTION 3: If you HAVE orphaned records and want to delete them:
-- ============================================================================
-- Uncomment the following to delete orphaned records first:

-- DELETE FROM job_offers
-- WHERE usn NOT IN (SELECT usn FROM students);

-- Then run Option 1 above

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running the above, verify the constraint exists:
-- SELECT 
--   conname AS constraint_name,
--   conrelid::regclass AS table_name,
--   confrelid::regclass AS referenced_table
-- FROM pg_constraint
-- WHERE conname = 'fk_student_usn';

-- ============================================================================
-- NOTES
-- ============================================================================
-- - The constraint ensures referential integrity: you can only insert job_offers
--   with a usn that exists in the students table
-- - ON DELETE CASCADE means if a student is deleted, all their job_offers
--   will be automatically deleted
-- - If you get an error about existing data violating the constraint, use
--   Option 2 or Option 3 above to handle orphaned records first
--
-- ============================================================================
-- CSV IMPORT ISSUE: "Data incompatible" Error
-- ============================================================================
-- If you're getting "Data incompatible" error when importing CSV:
-- 1. Your CSV contains USNs that don't exist in students table
-- 2. Solution: Add missing students to students table first
-- 3. See fix_csv_import_issue.sql for detailed help
-- ============================================================================

