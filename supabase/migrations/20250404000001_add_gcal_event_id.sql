-- Add Google Calendar event ID column to events table
ALTER TABLE events ADD COLUMN gcal_event_id text;

-- Add an index for faster lookups by Google Calendar event ID
CREATE INDEX events_gcal_event_id_idx ON events(gcal_event_id);

-- Add a comment explaining the column
COMMENT ON COLUMN events.gcal_event_id IS 'The Google Calendar event ID for syncing with Google Calendar'; 