/*
  # Create site_users table for member management

  1. New Tables
    - `site_users`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, not null, unique)
      - `role` (text, not null, default 'member')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `site_users` table
    - Add policy for authenticated users to read their own data
    - Add policy for admins to read all data
*/

CREATE TABLE IF NOT EXISTS site_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE site_users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON site_users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Allow users with admin role to read all data
CREATE POLICY "Admins can read all data"
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