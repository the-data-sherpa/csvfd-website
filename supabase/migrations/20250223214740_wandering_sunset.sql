/*
  # Add fire and medical call tracking

  1. Changes
    - Add separate columns for fire and medical calls
    - Update existing data to maintain consistency
    - Add trigger to maintain call_count as sum of fire and medical
*/

-- First, temporarily disable the check constraint if it exists
ALTER TABLE call_statistics 
DROP CONSTRAINT IF EXISTS call_count_matches_sum;

-- Add new columns with defaults
ALTER TABLE call_statistics 
ADD COLUMN IF NOT EXISTS fires integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS medical integer NOT NULL DEFAULT 0;

-- Update existing rows to split call_count between fires and medical
DO $$ 
BEGIN
  UPDATE call_statistics
  SET 
    fires = FLOOR(call_count * 0.5),
    medical = call_count - FLOOR(call_count * 0.5)
  WHERE fires = 0 AND medical = 0 AND call_count > 0;
END $$;

-- Add check constraint to ensure call_count matches sum
ALTER TABLE call_statistics
ADD CONSTRAINT call_count_matches_sum 
CHECK (call_count = fires + medical);

-- Create trigger to automatically update call_count
CREATE OR REPLACE FUNCTION update_call_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.call_count = NEW.fires + NEW.medical;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_call_count_trigger ON call_statistics;

-- Create new trigger
CREATE TRIGGER update_call_count_trigger
  BEFORE INSERT OR UPDATE ON call_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_call_count();