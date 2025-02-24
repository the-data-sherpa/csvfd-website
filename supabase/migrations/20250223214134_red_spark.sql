/*
  # Fix Call Statistics RLS Policies

  1. Changes
    - Drop existing policies
    - Create new RLS policies with proper access control
    - Add service role policy for admin operations

  2. Security
    - Public read access for all users
    - Authenticated users with webmaster/admin roles can manage statistics
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view call statistics" ON call_statistics;
DROP POLICY IF EXISTS "Authenticated users can manage call statistics" ON call_statistics;

-- Allow public read access
CREATE POLICY "Public can view call statistics"
  ON call_statistics
  FOR SELECT
  TO public
  USING (true);

-- Allow webmasters and admins to manage call statistics
CREATE POLICY "Webmasters and admins can manage call statistics"
  ON call_statistics
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

-- Allow service role full access
CREATE POLICY "Service role has full access"
  ON call_statistics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);