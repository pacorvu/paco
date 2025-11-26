-- ============================================================================
-- FIX CSV IMPORT ISSUE: Data Incompatible
-- ============================================================================
-- This script helps identify and fix USN mismatches when importing job_offers CSV
-- The error occurs because job_offers.usn must reference an existing students.usn
-- ============================================================================

-- ============================================================================
-- STEP 1: Check for orphaned records in job_offers (if any exist)
-- ============================================================================
-- This shows job_offers with USNs that don't exist in students table
SELECT 
  jo.id,
  jo.usn,
  jo.company_name,
  jo.designation
FROM job_offers jo
LEFT JOIN students s ON jo.usn = s.usn
WHERE s.usn IS NULL;

-- Count of orphaned records
SELECT COUNT(*) as orphaned_records_count
FROM job_offers jo
LEFT JOIN students s ON jo.usn = s.usn
WHERE s.usn IS NULL;

-- ============================================================================
-- STEP 2: If importing via Supabase Table Editor CSV import:
-- ============================================================================
-- Before importing, you need to ensure all USNs in your CSV exist in students table
-- 
-- Option A: Check which USNs from your CSV are missing
-- (Replace 'YOUR_CSV_USN_VALUES' with actual USNs from your CSV)
-- ============================================================================

-- Example: Check if specific USNs exist
-- Replace these with actual USNs from your CSV
SELECT 
  usn,
  CASE 
    WHEN EXISTS (SELECT 1 FROM students WHERE students.usn = usn_check.usn) 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
FROM (VALUES 
  ('USN001'),  -- Replace with actual USNs from your CSV
  ('USN002'),
  ('USN003')
  -- Add more USNs here
) AS usn_check(usn);

-- ============================================================================
-- STEP 3: Get all unique USNs from job_offers that are missing in students
-- ============================================================================
SELECT DISTINCT jo.usn
FROM job_offers jo
LEFT JOIN students s ON jo.usn = s.usn
WHERE s.usn IS NULL
ORDER BY jo.usn;

-- ============================================================================
-- STEP 4: Solution Options
-- ============================================================================

-- OPTION 1: Delete orphaned records (if they're invalid)
-- WARNING: This will permanently delete job_offers with invalid USNs
-- Uncomment to run:
/*
DELETE FROM job_offers
WHERE usn NOT IN (SELECT usn FROM students);
*/

-- OPTION 2: Add missing students first (RECOMMENDED)
-- If you have student data, insert them into students table first
-- Example format (adjust columns as needed):
/*
INSERT INTO students (usn, student_name, email_id, contact_number, gender, program, specialization, school)
VALUES 
  ('USN001', 'Student Name 1', 'email1@example.com', '1234567890', 'M', 'Program', 'Specialization', 'School'),
  ('USN002', 'Student Name 2', 'email2@example.com', '0987654321', 'F', 'Program', 'Specialization', 'School')
  -- Add more students as needed
ON CONFLICT (usn) DO NOTHING;  -- Skip if USN already exists
*/

-- OPTION 3: Temporarily disable foreign key constraint (NOT RECOMMENDED)
-- Only use this if you're sure about the data and will fix it later
-- WARNING: This can lead to data integrity issues
/*
-- Drop constraint temporarily
ALTER TABLE job_offers 
DROP CONSTRAINT IF EXISTS fk_student_usn;

-- Import your CSV data here via Supabase Table Editor

-- Re-add constraint (will fail if orphaned records exist)
ALTER TABLE job_offers
ADD CONSTRAINT fk_student_usn 
FOREIGN KEY (usn) 
REFERENCES students(usn) 
ON DELETE CASCADE;
*/

-- ============================================================================
-- STEP 5: Validate data after import
-- ============================================================================
-- Run this after importing to ensure all records are valid
SELECT 
  COUNT(*) as total_job_offers,
  COUNT(DISTINCT jo.usn) as unique_usns,
  COUNT(CASE WHEN s.usn IS NOT NULL THEN 1 END) as valid_records,
  COUNT(CASE WHEN s.usn IS NULL THEN 1 END) as invalid_records
FROM job_offers jo
LEFT JOIN students s ON jo.usn = s.usn;

-- ============================================================================
-- STEP 6: Find missing USNs from a list (for CSV validation)
-- ============================================================================
-- If you have a list of USNs from your CSV, use this to find which are missing
-- Replace the VALUES with your actual USNs
WITH csv_usns AS (
  SELECT usn FROM (VALUES 
    ('USN001'),  -- Replace with USNs from your CSV
    ('USN002'),
    ('USN003')
    -- Add all USNs from your CSV here
  ) AS t(usn)
)
SELECT 
  csv_usns.usn,
  CASE 
    WHEN s.usn IS NOT NULL THEN 'EXISTS - OK to import'
    ELSE 'MISSING - Add to students table first'
  END as status,
  s.student_name,
  s.school
FROM csv_usns
LEFT JOIN students s ON csv_usns.usn = s.usn
ORDER BY status, csv_usns.usn;

-- ============================================================================
-- RECOMMENDED WORKFLOW FOR CSV IMPORT:
-- ============================================================================
-- 1. Extract all unique USNs from your job_offers CSV
-- 2. Run STEP 6 query with your USNs to identify missing ones
-- 3. Add missing students to students table first (OPTION 2)
-- 4. Then import your job_offers CSV
-- 5. Run STEP 5 to validate the import
-- ============================================================================

