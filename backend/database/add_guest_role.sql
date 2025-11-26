-- Add 'guest' role to existing register table
-- Drop the existing constraint and add a new one with 'guest' included

ALTER TABLE register 
DROP CONSTRAINT IF EXISTS register_role_check;

ALTER TABLE register 
ADD CONSTRAINT register_role_check 
CHECK (role IN ('admin', 'vc', 'guest'));

