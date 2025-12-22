-- SQL to map job_offers.company_name to companies.company_name
-- Run this in Supabase SQL Editor

-- Step 1: Find company names in job_offers that don't exist in companies table
-- This query will show you which companies need to be added to the companies table
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

-- Step 2: Optional - Insert missing companies into companies table
-- Uncomment and run this AFTER reviewing the missing companies from Step 1
-- This will create entries in companies table for all unique company names from job_offers
/*
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
*/

-- Step 3: Add foreign key constraint to map job_offers.company_name to companies.company_name
-- IMPORTANT: Run this ONLY after ensuring all company names exist in companies table
-- If there are NULL or empty company_name values, they will be allowed (since foreign key allows NULL)

-- First, ensure company_name column in job_offers can reference companies.company_name
-- Since companies.company_name is VARCHAR(255) and job_offers.company_name is TEXT,
-- we need to ensure compatibility. PostgreSQL handles this, but we'll add the constraint.

ALTER TABLE job_offers
ADD CONSTRAINT fk_job_offers_company_name 
FOREIGN KEY (company_name) 
REFERENCES companies(company_name) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Note: ON DELETE SET NULL means if a company is deleted, the job_offers.company_name will be set to NULL
-- If you prefer CASCADE (delete job offers when company is deleted), change to:
-- ON DELETE CASCADE

-- Step 4: Create an index on company_name in job_offers for better join performance
CREATE INDEX IF NOT EXISTS idx_job_offers_company_name ON job_offers(company_name);

