/*
  # Call Statistics Schema

  1. New Tables
    - `monthly_call_stats`
      - `id` (uuid, primary key)
      - `year` (integer)
      - `month` (integer, 1-12)
      - `fires` (integer)
      - `medical` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `yearly_call_stats`
      - `id` (uuid, primary key)
      - `year` (integer)
      - `total_calls` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Public read access
    - Webmaster/admin write access
*/

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

-- Create yearly call statistics table
CREATE TABLE yearly_call_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL UNIQUE,
  total_calls integer NOT NULL DEFAULT 0 CHECK (total_calls >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE monthly_call_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_call_stats ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public can view monthly stats"
  ON monthly_call_stats
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view yearly stats"
  ON yearly_call_stats
  FOR SELECT
  TO public
  USING (true);

-- Webmaster/admin management policies
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

CREATE POLICY "Webmasters and admins can manage yearly stats"
  ON yearly_call_stats
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

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monthly_stats_updated_at
  BEFORE UPDATE ON monthly_call_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yearly_stats_updated_at
  BEFORE UPDATE ON yearly_call_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update yearly stats from monthly data
CREATE OR REPLACE FUNCTION update_yearly_stats()
RETURNS TRIGGER AS $$
DECLARE
  year_total integer;
BEGIN
  -- Calculate total for the affected year
  SELECT SUM(fires + medical)
  INTO year_total
  FROM monthly_call_stats
  WHERE year = NEW.year;

  -- Insert or update yearly stats
  INSERT INTO yearly_call_stats (year, total_calls)
  VALUES (NEW.year, COALESCE(year_total, 0))
  ON CONFLICT (year) DO UPDATE
  SET total_calls = EXCLUDED.total_calls;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update yearly stats when monthly stats change
CREATE TRIGGER update_yearly_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON monthly_call_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_yearly_stats();