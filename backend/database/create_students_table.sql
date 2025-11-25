-- Create students table (PostgreSQL/Supabase compatible)
CREATE TABLE IF NOT EXISTS students (
    school TEXT,
    student_name TEXT NOT NULL,
    usn TEXT PRIMARY KEY NOT NULL,
    email_id TEXT,
    contact_number TEXT,
    gender TEXT,
    program TEXT,
    specialization TEXT,
    placement_declaration_status TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on usn for faster lookups (though it's already unique)
CREATE INDEX IF NOT EXISTS idx_students_usn ON students(usn);

-- Create index on email_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email_id);

