-- Drop existing update policy
DROP POLICY IF EXISTS "Members can update own events" ON "events";
DROP POLICY IF EXISTS "Point of contact can manage signup sheet events" ON "events";

-- Create a new combined update policy
CREATE POLICY "Users can update events they own or manage" ON "events"
FOR UPDATE
USING (
  -- User is the creator
  created_by = auth.uid() OR
  -- User is point of contact for associated signup sheet
  EXISTS (
    SELECT 1 FROM signup_sheets
    WHERE signup_sheets.calendar_id = events.id
    AND auth.uid() = ANY(signup_sheets.point_of_contact)
  ) OR
  -- User is admin or webmaster
  EXISTS (
    SELECT 1 FROM site_users
    WHERE site_users.authid = auth.uid()
    AND site_users.role IN ('admin', 'webmaster')
  )
)
WITH CHECK (true);

-- Recreate the general management policy for other operations
CREATE POLICY "Users can manage events they own or manage" ON "events"
FOR ALL
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM signup_sheets
    WHERE signup_sheets.calendar_id = events.id
    AND auth.uid() = ANY(signup_sheets.point_of_contact)
  ) OR
  EXISTS (
    SELECT 1 FROM site_users
    WHERE site_users.authid = auth.uid()
    AND site_users.role IN ('admin', 'webmaster')
  )
); 