-- SQL for creating contacts table in Supabase
-- This table stores contact information for companies
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS contacts (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone_number VARCHAR(50),
    role_title VARCHAR(255),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_contacts_company_id 
        FOREIGN KEY (company_id) 
        REFERENCES companies(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create an index on company_id for faster joins
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Optional: Create a trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_contacts_updated_at();

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Example policy: Allow all authenticated users to read contacts
-- You can modify this based on your security requirements
CREATE POLICY "Allow authenticated users to read contacts"
    ON contacts FOR SELECT
    TO authenticated
    USING (true);

-- Example policy: Allow authenticated users to insert contacts
-- You can modify this based on your security requirements
CREATE POLICY "Allow authenticated users to insert contacts"
    ON contacts FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Example policy: Allow authenticated users to update contacts
-- You can modify this based on your security requirements
CREATE POLICY "Allow authenticated users to update contacts"
    ON contacts FOR UPDATE
    TO authenticated
    USING (true);

-- Example policy: Allow authenticated users to delete contacts
-- You can modify this based on your security requirements
CREATE POLICY "Allow authenticated users to delete contacts"
    ON contacts FOR DELETE
    TO authenticated
    USING (true);

