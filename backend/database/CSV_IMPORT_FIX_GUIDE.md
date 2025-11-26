# CSV Import Fix Guide: "Data incompatible" Error

## Problem
You're getting a **"Data incompatible"** error when importing CSV data into the `job_offers` table. This happens because:

- The foreign key constraint requires that every `usn` in `job_offers` must exist in the `students` table
- Your CSV contains USN values that don't exist in the `students` table

## Quick Solution

### Step 1: Identify Missing USNs

Before importing your CSV, check which USNs are missing. You can do this in Supabase SQL Editor:

```sql
-- Replace the USNs below with actual USNs from your CSV
WITH csv_usns AS (
  SELECT usn FROM (VALUES 
    ('1RV20CS001'),  -- Replace with your actual USNs
    ('1RV20CS002'),
    ('1RV20CS003')
    -- Add all USNs from your CSV here
  ) AS t(usn)
)
SELECT 
  csv_usns.usn,
  CASE 
    WHEN s.usn IS NOT NULL THEN '✅ EXISTS - OK to import'
    ELSE '❌ MISSING - Add to students table first'
  END as status
FROM csv_usns
LEFT JOIN students s ON csv_usns.usn = s.usn
ORDER BY status, csv_usns.usn;
```

### Step 2: Add Missing Students

For each missing USN, add the student record to the `students` table:

```sql
INSERT INTO students (usn, student_name, email_id, contact_number, gender, program, specialization, school)
VALUES 
  ('1RV20CS001', 'Student Name', 'email@example.com', '1234567890', 'M', 'Program', 'Specialization', 'School Name')
ON CONFLICT (usn) DO NOTHING;
```

**Note:** You can add minimal data - at minimum, you need:
- `usn` (required, primary key)
- `student_name` (required)

Other fields can be NULL if you don't have the data yet.

### Step 3: Import Your CSV

Once all USNs exist in the `students` table, you can import your CSV into `job_offers` without errors.

## Alternative: Bulk Import Students from CSV

If you have a students CSV file:

1. Import students CSV first into the `students` table
2. Then import job_offers CSV

## Verify After Import

After importing, verify all records are valid:

```sql
SELECT 
  COUNT(*) as total_job_offers,
  COUNT(CASE WHEN s.usn IS NOT NULL THEN 1 END) as valid_records,
  COUNT(CASE WHEN s.usn IS NULL THEN 1 END) as invalid_records
FROM job_offers jo
LEFT JOIN students s ON jo.usn = s.usn;
```

You should see `invalid_records = 0`.

## Files for Reference

- `fix_csv_import_issue.sql` - Detailed SQL queries for troubleshooting
- `restore_job_offers_foreign_key.sql` - SQL to restore the foreign key constraint

## Why This Constraint Exists

The foreign key ensures data integrity:
- Prevents orphaned job offers (offers for non-existent students)
- Maintains referential integrity between tables
- Ensures accurate reporting and statistics

