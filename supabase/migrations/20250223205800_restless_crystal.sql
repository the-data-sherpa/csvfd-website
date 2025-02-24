/*
  # Fix RLS policies and add role management

  1. Changes
    - Remove all existing RLS policies
    - Add simplified RLS for authenticated users
    - Add role validation constraint

  2. Security
    - Maintain basic authentication checks
    - Move role-based access control to application level
    - Enforce valid role values
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON site_users;
DROP POLICY IF EXISTS "Admins can manage all users" ON site_users;
DROP POLICY IF EXISTS "Authenticated users can read site_users" ON site_users;
DROP POLICY IF EXISTS "Authenticated users can update site_users" ON site_users;

-- Modify the site_users table to enforce role validation
ALTER TABLE site_users
DROP CONSTRAINT IF EXISTS site_users_role_check;

ALTER TABLE site_users
ADD CONSTRAINT site_users_role_check
CHECK (role IN ('member', 'webmaster', 'admin'));

-- Add simplified RLS for authenticated users
CREATE POLICY "Authenticated users can read site_users"
  ON site_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update site_users"
  ON site_users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);