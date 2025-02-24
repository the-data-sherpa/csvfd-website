/*
  # Create pages and sections tables for CMS

  1. New Tables
    - `pages`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `title` (text) - Page title
      - `section` (text) - Main section (e.g., 'our-department', 'services')
      - `content` (text) - Markdown content
      - `order` (integer) - Display order within section
      - `published` (boolean) - Publication status
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `meta_description` (text) - SEO description
      - `meta_keywords` (text) - SEO keywords

  2. Security
    - Enable RLS on `pages` table
    - Add policies for public read access
    - Add policies for authenticated users to manage content
*/

CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  section text NOT NULL,
  content text NOT NULL,
  "order" integer DEFAULT 0,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  meta_description text,
  meta_keywords text
);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published pages
CREATE POLICY "Public can view published pages"
  ON pages
  FOR SELECT
  TO public
  USING (published = true);

-- Allow authenticated users to manage pages
CREATE POLICY "Authenticated users can manage pages"
  ON pages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);