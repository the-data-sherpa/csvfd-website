-- Create member_announcements table
CREATE TABLE member_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_by TEXT NOT NULL
);

-- Set up RLS policies
ALTER TABLE member_announcements ENABLE ROW LEVEL SECURITY;

-- Create policies

-- All members can view announcements
CREATE POLICY "Members can view announcements"
ON member_announcements
FOR SELECT
TO authenticated
USING (true);

-- Members can create announcements
CREATE POLICY "Members can create announcements"
ON member_announcements
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Members can update their own announcements
CREATE POLICY "Members can update their own announcements"
ON member_announcements
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Members can delete their own announcements
CREATE POLICY "Members can delete their own announcements"
ON member_announcements
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Webmasters and admins can delete any announcement
CREATE POLICY "Admins and webmasters can delete any announcement"
ON member_announcements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_users
    WHERE authid = auth.uid()
    AND role IN ('admin', 'webmaster')
  )
); 