/*
  # Simplify yearly call statistics

  1. Changes
    - Remove fires and medical columns from yearly_call_stats
    - Remove check constraint for fires + medical = total
    - Keep year range check for last 10 years
*/

-- First drop the existing check constraint
ALTER TABLE yearly_call_stats
DROP CONSTRAINT IF EXISTS yearly_call_stats_total_calls_check;

-- Drop the fires and medical columns
ALTER TABLE yearly_call_stats
DROP COLUMN fires,
DROP COLUMN medical;

-- Add new check constraint for total_calls
ALTER TABLE yearly_call_stats
ADD CONSTRAINT yearly_call_stats_total_calls_check
CHECK (total_calls >= 0);