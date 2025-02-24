/*
  # Make yearly stats standalone

  1. Changes
    - Drop existing trigger that updates yearly stats from monthly data
    - Add 10 years of default data for yearly stats
*/

-- Drop the trigger that updates yearly stats from monthly data
DROP TRIGGER IF EXISTS update_yearly_stats_trigger ON monthly_call_stats;
DROP FUNCTION IF EXISTS update_yearly_stats();

-- Insert 10 years of default data if not exists
DO $$ 
DECLARE
  current_year integer := EXTRACT(YEAR FROM CURRENT_DATE);
  year_to_insert integer;
BEGIN
  FOR i IN 0..9 LOOP
    year_to_insert := current_year - i;
    
    -- Only insert if the year doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM yearly_call_stats WHERE year = year_to_insert
    ) THEN
      INSERT INTO yearly_call_stats (year, total_calls)
      VALUES (year_to_insert, 0);
    END IF;
  END LOOP;
END $$;