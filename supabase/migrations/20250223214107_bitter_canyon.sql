/*
  # Add Call Statistics Table and Triggers

  1. New Tables
    - `call_statistics`
      - `id` (uuid, primary key)
      - `year` (integer)
      - `month` (integer, 1-12)
      - `call_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Constraints
    - Unique constraint on year/month combination
    - Check constraint to ensure month is between 1 and 12
    - Default value of 0 for call_count

  3. Security
    - Enable RLS
    - Public read access
    - Authenticated users can manage statistics
*/

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS call_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  call_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(year, month)
);

-- Enable RLS if not already enabled
ALTER TABLE call_statistics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view call statistics" ON call_statistics;
DROP POLICY IF EXISTS "Authenticated users can manage call statistics" ON call_statistics;

-- Create new policies
CREATE POLICY "Public can view call statistics"
  ON call_statistics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage call statistics"
  ON call_statistics
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_call_statistics_updated_at ON call_statistics;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
CREATE TRIGGER update_call_statistics_updated_at
  BEFORE UPDATE ON call_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();