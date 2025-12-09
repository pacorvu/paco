-- Fix Missing Companies - Run this to resolve foreign key constraint violations
-- Run this in Supabase SQL Editor

-- Step 1: Find ALL company names in job_offers that don't exist in companies table
-- This will show you exactly which companies are missing
SELECT DISTINCT 
    jo.company_name,
    COUNT(*) as job_offer_count
FROM job_offers jo
WHERE jo.company_name IS NOT NULL
    AND jo.company_name != ''
    AND jo.company_name NOT IN (
        SELECT company_name 
        FROM companies 
        WHERE company_name IS NOT NULL
    )
GROUP BY jo.company_name
ORDER BY jo.company_name;

-- Step 2: Insert ALL missing companies into companies table
-- This will automatically create entries for all company names that exist in job_offers
-- but don't exist in companies table yet
INSERT INTO companies (company_name, created_at, updated_at)
SELECT DISTINCT 
    jo.company_name,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM job_offers jo
WHERE jo.company_name IS NOT NULL
    AND jo.company_name != ''
    AND jo.company_name NOT IN (
        SELECT company_name 
        FROM companies 
        WHERE company_name IS NOT NULL
    )
ON CONFLICT (company_name) DO NOTHING;

-- Step 3: Verify - Check if there are still any missing companies
-- This should return 0 rows if everything is fixed
SELECT DISTINCT 
    jo.company_name,
    COUNT(*) as job_offer_count
FROM job_offers jo
WHERE jo.company_name IS NOT NULL
    AND jo.company_name != ''
    AND jo.company_name NOT IN (
        SELECT company_name 
        FROM companies 
        WHERE company_name IS NOT NULL
    )
GROUP BY jo.company_name
ORDER BY jo.company_name;

-- If Step 3 returns 0 rows, you're all set! The foreign key constraint should work now.

