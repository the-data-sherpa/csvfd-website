/*
  # Update monthly call stats table structure

  1. Changes
    - Add fires and medical columns to monthly_call_stats table if they don't exist
    - Add check constraints for non-negative values
*/

DO $$ 
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'monthly_call_stats' AND column_name = 'fires'
  ) THEN
    ALTER TABLE monthly_call_stats
    ADD COLUMN fires integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'monthly_call_stats' AND column_name = 'medical'
  ) THEN
    ALTER TABLE monthly_call_stats
    ADD COLUMN medical integer NOT NULL DEFAULT 0;
  END IF;

  -- Add check constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints
    WHERE constraint_name = 'monthly_call_stats_fires_non_negative'
  ) THEN
    ALTER TABLE monthly_call_stats
    ADD CONSTRAINT monthly_call_stats_fires_non_negative CHECK (fires >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints
    WHERE constraint_name = 'monthly_call_stats_medical_non_negative'
  ) THEN
    ALTER TABLE monthly_call_stats
    ADD CONSTRAINT monthly_call_stats_medical_non_negative CHECK (medical >= 0);
  END IF;
END $$;