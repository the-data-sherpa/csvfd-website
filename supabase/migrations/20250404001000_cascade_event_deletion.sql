-- Drop the existing foreign key constraint
ALTER TABLE signup_sheets
DROP CONSTRAINT IF EXISTS signup_sheets_calendar_id_fkey;

-- Add the new foreign key constraint with CASCADE
ALTER TABLE signup_sheets
ADD CONSTRAINT signup_sheets_calendar_id_fkey
FOREIGN KEY (calendar_id)
REFERENCES events(id)
ON DELETE CASCADE; 