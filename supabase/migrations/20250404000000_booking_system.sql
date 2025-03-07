-- Create locations table
CREATE TABLE "locations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create events table
CREATE TABLE "events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "location_id" UUID REFERENCES "locations" (id) ON DELETE CASCADE,
  "start_time" TIMESTAMP WITH TIME ZONE NOT NULL,
  "end_time" TIMESTAMP WITH TIME ZONE NOT NULL,
  "is_public" BOOLEAN DEFAULT true NOT NULL,
  "created_by" UUID REFERENCES "auth"."users" (id) ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create RLS policies
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;

-- Insert default locations
INSERT INTO "locations" ("name", "description") VALUES
('Main Station', 'The main fire station building and apparatus bays'),
('Training Room', 'Large meeting and training room'),
('Conference Room', 'Small conference room for meetings');

-- Everyone can view locations
CREATE POLICY "Everyone can view locations" ON "locations"
FOR SELECT
USING (true);

-- Only admins and webmasters can manage locations
CREATE POLICY "Admins and Webmasters can manage locations" ON "locations"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM site_users
    WHERE site_users.email = auth.jwt() ->> 'email'
    AND site_users.role IN ('admin', 'webmaster')
  )
);

-- Everyone can view events
CREATE POLICY "Everyone can view events" ON "events"
FOR SELECT
USING (true);

-- Members can create events
CREATE POLICY "Members can create events" ON "events"
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
  )
);

-- Members can update their own events
CREATE POLICY "Members can update own events" ON "events"
FOR UPDATE
USING (created_by = auth.uid());

-- Members can delete their own events
CREATE POLICY "Members can delete own events" ON "events"
FOR DELETE
USING (created_by = auth.uid());

-- Admins and Webmasters can manage all events
CREATE POLICY "Admins and Webmasters can manage events" ON "events"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM site_users
    WHERE site_users.authid = auth.uid()
    AND site_users.role IN ('admin', 'webmaster')
  )
);

-- Function to check if events overlap for a location
CREATE OR REPLACE FUNCTION check_event_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM events
    WHERE location_id = NEW.location_id
    AND id != NEW.id
    AND (
      (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Event overlaps with an existing event at this location';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check for overlapping events
CREATE TRIGGER check_event_overlap_trigger
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION check_event_overlap(); 