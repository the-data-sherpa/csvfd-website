/*
  # Add Member Features

  1. New Tables
    - `duty_shifts`: Track member duty schedules
    - `equipment_checks`: Log daily apparatus inspections
    - `emergency_contacts`: Store important contact information
  
  2. Updates
    - Add new fields to `site_users` table for member information
    
  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated access
*/

-- Add new fields to site_users
ALTER TABLE site_users
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS emergency_phone text,
ADD COLUMN IF NOT EXISTS certification_level text,
ADD COLUMN IF NOT EXISTS certifications_expire timestamptz;

-- Create duty_shifts table
CREATE TABLE IF NOT EXISTS duty_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES site_users(id) ON DELETE CASCADE,
  date date NOT NULL,
  shift_type text NOT NULL CHECK (shift_type IN ('day', 'night')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed')),
  created_at timestamptz DEFAULT now()
);

-- Create equipment_checks table
CREATE TABLE IF NOT EXISTS equipment_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apparatus text NOT NULL,
  checked_by uuid REFERENCES site_users(id) ON DELETE SET NULL,
  check_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('passed', 'failed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  phone text NOT NULL,
  alternate_phone text,
  email text,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE duty_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can manage duty_shifts"
  ON duty_shifts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage equipment_checks"
  ON equipment_checks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read emergency_contacts"
  ON emergency_contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage emergency_contacts"
  ON emergency_contacts
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM site_users 
    WHERE email = auth.jwt() ->> 'email' 
    AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM site_users 
    WHERE email = auth.jwt() ->> 'email' 
    AND role = 'admin'
  ));