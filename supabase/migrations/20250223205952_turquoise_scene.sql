/*
  # Simplify RLS policies

  1. Changes
    - Drop all existing RLS policies for site_users and pages
    - Create simplified RLS policies that allow authenticated users full access
    - Keep role validation at the table level
    - Move role management to application level

  2. Security
    - Maintain role validation constraint
    - Enable RLS on tables
    - Allow authenticated users full access
    - Public can only read published pages
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can read published pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can manage pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users can read site_users" ON site_users;
DROP POLICY IF EXISTS "Authenticated users can update site_users" ON site_users;

-- Maintain role validation on site_users
ALTER TABLE site_users
DROP CONSTRAINT IF EXISTS site_users_role_check;

ALTER TABLE site_users
ADD CONSTRAINT site_users_role_check
CHECK (role IN ('member', 'webmaster', 'admin'));

-- Simple RLS for pages
CREATE POLICY "Public can read published pages"
  ON pages
  FOR SELECT
  TO public
  USING (published = true);

CREATE POLICY "Authenticated users can manage pages"
  ON pages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Simple RLS for site_users
CREATE POLICY "Authenticated users can manage site_users"
  ON site_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);