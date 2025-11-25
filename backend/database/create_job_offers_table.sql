-- Create job_offers table (PostgreSQL/Supabase compatible)
-- This table stores job offers/internships for students
-- A student (usn) can have multiple job offers, so usn is not unique here
CREATE TABLE IF NOT EXISTS job_offers (
    id SERIAL PRIMARY KEY,
    usn TEXT NOT NULL,
    company_name TEXT,
    job_type TEXT,
    internship_duration TEXT,
    internship_stipend TEXT,
    ctc_min_lpa NUMERIC,
    ctc_max_lpa NUMERIC,
    ctc_variable_pay TEXT,
    designation TEXT,
    final_interview_status TEXT,
    offer_letter_status TEXT,
    upload_offer_letter_link TEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Foreign key constraint to link with students table
    CONSTRAINT fk_student_usn FOREIGN KEY (usn) REFERENCES students(usn) ON DELETE CASCADE
);

-- Create index on usn for faster lookups (since it's a foreign key and will be queried often)
CREATE INDEX IF NOT EXISTS idx_job_offers_usn ON job_offers(usn);

-- Create index on company_name for filtering by company
CREATE INDEX IF NOT EXISTS idx_job_offers_company ON job_offers(company_name);

-- Create index on job_type for filtering
CREATE INDEX IF NOT EXISTS idx_job_offers_job_type ON job_offers(job_type);

