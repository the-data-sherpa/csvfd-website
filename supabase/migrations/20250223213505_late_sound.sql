/*
  # Add call statistics tracking

  1. New Tables
    - `call_statistics`
      - `id` (uuid, primary key)
      - `year` (integer)
      - `month` (integer)
      - `call_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `call_statistics` table
    - Add policies for public read access
    - Add policies for authenticated users to manage data
*/

CREATE TABLE IF NOT EXISTS call_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  call_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(year, month)
);

ALTER TABLE call_statistics ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view call statistics"
  ON call_statistics
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to manage call statistics
CREATE POLICY "Authenticated users can manage call statistics"
  ON call_statistics
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update the updated_at column
CREATE TRIGGER update_call_statistics_updated_at
  BEFORE UPDATE ON call_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();