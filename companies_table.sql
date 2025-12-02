-- SQL for creating companies table in Supabase
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    company_type VARCHAR(100),
    address TEXT,
    website VARCHAR(500),
    linkedin VARCHAR(500),
    remarks1 TEXT,
    remarks2 TEXT,
    remarks3 TEXT,
    company_logo_link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: The UNIQUE constraint on company_name automatically creates an index for faster searches

-- Create an index on company_type for filtering
CREATE INDEX IF NOT EXISTS idx_companies_company_type ON companies(company_type);

-- Optional: Create a trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Example policy: Allow all authenticated users to read companies
-- You can modify this based on your security requirements
CREATE POLICY "Allow authenticated users to read companies"
    ON companies FOR SELECT
    TO authenticated
    USING (true);

-- Example policy: Allow authenticated users to insert companies
-- You can modify this based on your security requirements
CREATE POLICY "Allow authenticated users to insert companies"
    ON companies FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Example policy: Allow authenticated users to update companies
-- You can modify this based on your security requirements
CREATE POLICY "Allow authenticated users to update companies"
    ON companies FOR UPDATE
    TO authenticated
    USING (true);

-- Example policy: Allow authenticated users to delete companies
-- You can modify this based on your security requirements
CREATE POLICY "Allow authenticated users to delete companies"
    ON companies FOR DELETE
    TO authenticated
    USING (true);

