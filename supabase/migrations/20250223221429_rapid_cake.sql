/*
  # Add service role policies for call statistics

  1. Changes
    - Add service role policies for monthly and yearly call statistics tables
    - Allow service role to bypass RLS for these tables
    - Ensure webmaster/admin policies remain in place for UI operations

  2. Security
    - Service role has full access to call statistics tables
    - Public can still read statistics
    - Webmasters and admins can manage through UI
*/

-- Add service role policies for monthly stats
CREATE POLICY "Service role has full access to monthly stats"
  ON monthly_call_stats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add service role policies for yearly stats
CREATE POLICY "Service role has full access to yearly stats"
  ON yearly_call_stats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to bypass RLS
ALTER TABLE monthly_call_stats FORCE ROW LEVEL SECURITY;
ALTER TABLE yearly_call_stats FORCE ROW LEVEL SECURITY;