/*
  # Update monthly call stats table structure

  1. Changes
    - Drop existing table and recreate with proper structure
    - Add proper constraints and policies
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS monthly_call_stats CASCADE;

-- Create monthly call statistics table
CREATE TABLE monthly_call_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  fires integer NOT NULL DEFAULT 0 CHECK (fires >= 0),
  medical integer NOT NULL DEFAULT 0 CHECK (medical >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(year, month)
);

-- Enable RLS
ALTER TABLE monthly_call_stats ENABLE ROW LEVEL SECURITY;

-- Public read access policy
CREATE POLICY "Public can view monthly stats"
  ON monthly_call_stats
  FOR SELECT
  TO public
  USING (true);

-- Webmaster/admin management policy
CREATE POLICY "Webmasters and admins can manage monthly stats"
  ON monthly_call_stats
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM site_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND role IN ('webmaster', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM site_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND role IN ('webmaster', 'admin')
    )
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_monthly_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monthly_stats_timestamp
  BEFORE UPDATE ON monthly_call_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_stats_updated_at();