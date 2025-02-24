/*
  # Update role system

  1. Changes
    - Modify site_users table to support three roles
    - Add check constraint for valid roles
    - Update RLS policies for role-based access

  2. Security
    - Enforce role validation
    - Update policies for granular access control
*/

-- Modify the site_users table to enforce role validation
ALTER TABLE site_users
DROP CONSTRAINT IF EXISTS site_users_role_check;

ALTER TABLE site_users
ADD CONSTRAINT site_users_role_check
CHECK (role IN ('member', 'webmaster', 'admin'));

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON site_users;
DROP POLICY IF EXISTS "Admins can read all data" ON site_users;

-- Create new role-based policies
CREATE POLICY "Users can read own data"
  ON site_users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Admins can manage all users"
  ON site_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM site_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND role = 'admin'
    )
  );

-- Update pages table policies
DROP POLICY IF EXISTS "Authenticated users can manage pages" ON pages;

CREATE POLICY "Webmasters and admins can manage pages"
  ON pages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM site_users 
      WHERE email = auth.jwt() ->> 'email' 
      AND role IN ('webmaster', 'admin')
    )
  );