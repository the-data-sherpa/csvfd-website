-- Add policy to allow point of contact users to manage events linked to their signup sheets
CREATE POLICY "Point of contact can manage signup sheet events" ON "events"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM signup_sheets
    WHERE signup_sheets.calendar_id = events.id
    AND auth.uid() = ANY(signup_sheets.point_of_contact)
  )
);

-- Update the existing "Everyone can view events" policy to ensure it works with signup sheets
DROP POLICY IF EXISTS "Everyone can view events" ON "events";
CREATE POLICY "Everyone can view events" ON "events"
FOR SELECT
USING (
  is_public = true OR
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