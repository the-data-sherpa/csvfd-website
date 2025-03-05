create or replace function public.fetch_events_with_details()
returns table (
  id uuid,
  title text,
  description text,
  location_id uuid,
  start_time timestamptz,
  end_time timestamptz,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  is_public boolean,
  gcal_event_id text,
  email text,
  location_name text
)
language sql
security definer
as $$
  select
    events.*,
    auth.users.email,
    locations.name as location_name
  from
    events
    join auth.users on events.created_by = auth.users.id
    join locations on events.location_id = locations.id
  order by events.start_time asc;
$$; 