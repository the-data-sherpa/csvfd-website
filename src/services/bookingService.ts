import { supabase } from '../lib/supabase';
import { Event, EventFormData, Location, CalendarEventDisplay } from '../types/booking';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './googleCalendar';

interface EventWithDetails extends Omit<Event, 'created_by_user' | 'location'> {
  email: string;
  location_name: string;
}

export const fetchEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .rpc('fetch_events_with_details') as { data: EventWithDetails[] | null, error: any };

  if (error) {
    console.error('Error fetching events:', error);
    throw new Error('Failed to fetch events');
  }

  // Transform the response to match the expected Event type structure
  const transformedData = data?.map(event => {
    const { email, location_name, ...rest } = event;
    return {
      ...rest,
      created_by_user: { email },
      location: {
        id: event.location_id,
        name: location_name,
        created_at: event.created_at,
        created_by: event.created_by
      }
    } as Event;
  });

  return transformedData || [];
};

export const fetchEvent = async (id: string): Promise<Event> => {
  const { data, error } = await supabase
    .rpc('fetch_events_with_details') as { data: EventWithDetails[] | null, error: any };

  if (error) {
    console.error('Error fetching event:', error);
    throw new Error('Failed to fetch event');
  }

  const event = data?.find(e => e.id === id);
  
  if (!event) {
    throw new Error('Event not found');
  }

  // Transform the response to match the expected Event type structure
  const { email, location_name, ...rest } = event;
  return {
    ...rest,
    created_by_user: { email },
    location: {
      id: event.location_id,
      name: location_name,
      created_at: event.created_at,
      created_by: event.created_by
    }
  } as Event;
};

export const createEvent = async (formData: EventFormData): Promise<Event> => {
  console.log('Creating event with form data:', formData);
  
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User must be logged in to create events');
  }
  
  console.log('Current user ID:', userData.user.id);
  
  const eventData = {
    ...formData,
    created_by: userData.user.id
  };
  
  console.log('Final event data to insert:', eventData);
  
  try {
    // Create event in Supabase first without Google Calendar ID
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select(`
        *,
        location:locations(*)
      `)
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw new Error(`Failed to create event: ${error.message}`);
    }

    console.log('Successfully created event in Supabase:', data);

    // Sync to Google Calendar
    try {
      const location = data.location?.name;
      const gcalEvent = await createCalendarEvent({
        title: data.title,
        description: data.description || '',
        start: data.start_time,
        end: data.end_time,
        location: location
      });
      
      console.log('Successfully created event in Google Calendar:', gcalEvent);
      
      // Update the Supabase event with the Google Calendar event ID
      const { error: updateError } = await supabase
        .from('events')
        .update({ gcal_event_id: gcalEvent.id })
        .eq('id', data.id);
        
      if (updateError) {
        console.error('Error updating event with Google Calendar ID:', updateError);
      }
      
      // Return the updated event data
      return {
        ...data,
        gcal_event_id: gcalEvent.id
      };
    } catch (gcalError) {
      console.error('Failed to sync event to Google Calendar:', gcalError);
      // Don't throw the error - we still want to return the created event
      return data;
    }
  } catch (error) {
    console.error('Exception during event creation:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, formData: EventFormData): Promise<Event> => {
  try {
    // Get the current event to get the Google Calendar event ID
    const { data: currentEvent, error: fetchError } = await supabase
      .from('events')
      .select(`
        *,
        location:locations(*)
      `)
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching current event:', fetchError);
      throw new Error('Failed to fetch current event');
    }

    // Update in Supabase
    const { data, error } = await supabase
      .from('events')
      .update(formData)
      .eq('id', id)
      .select(`
        *,
        location:locations(*)
      `)
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }

    // Sync to Google Calendar if we have a Google Calendar event ID
    if (currentEvent.gcal_event_id) {
      try {
        const location = data.location?.name;
        await updateCalendarEvent(currentEvent.gcal_event_id, {
          title: data.title,
          description: data.description || '',
          start: data.start_time,
          end: data.end_time,
          location: location
        });
        console.log('Successfully synced updated event to Google Calendar');
      } catch (gcalError) {
        console.error('Failed to sync event update to Google Calendar:', gcalError);
      }
    }

    return data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  console.log('[DEBUG] deleteEvent: Starting deletion of event with ID:', id);
  
  try {
    // Get the Google Calendar event ID before deleting from Supabase
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('gcal_event_id')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('[DEBUG] deleteEvent: Error fetching event:', fetchError);
      throw new Error(`Failed to fetch event: ${fetchError.message}`);
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DEBUG] deleteEvent: Error deleting event:', error);
      throw new Error(`Failed to delete event: ${error.message}`);
    }
    
    console.log('[DEBUG] deleteEvent: Successfully deleted event from Supabase with ID:', id);

    // Delete from Google Calendar if we have a Google Calendar event ID
    if (event?.gcal_event_id) {
      try {
        await deleteCalendarEvent(event.gcal_event_id);
        console.log('[DEBUG] deleteEvent: Successfully deleted event from Google Calendar');
      } catch (gcalError) {
        console.error('[DEBUG] deleteEvent: Failed to delete event from Google Calendar:', gcalError);
      }
    }
  } catch (e) {
    console.error('[DEBUG] deleteEvent: Exception during deletion:', e);
    throw e;
  }
};

export const fetchLocations = async (): Promise<Location[]> => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching locations:', error);
    throw new Error('Failed to fetch locations');
  }

  return data || [];
};

// Helper function to format date for iCal
const formatDateForICal = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// Helper function to escape text for iCal
const escapeICalText = (text: string): string => {
  return text
    .replace(/[\\;,]/g, (match) => '\\' + match)
    .replace(/\n/g, '\\n');
};

export const exportEventsToICal = (events: Event[]): void => {
  // Start building iCal content
  let icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cool Spring VFD//Events Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Cool Spring VFD Events',
    'X-WR-TIMEZONE:America/New_York'
  ];

  // Add each event
  events.forEach(event => {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    
    // Create event lines, excluding optional fields if they're empty
    const eventLines = [
      'BEGIN:VEVENT',
      `UID:${event.id}@coolspringsvfd.org`,
      `DTSTAMP:${formatDateForICal(new Date())}`,
      `DTSTART:${formatDateForICal(startDate)}`,
      `DTEND:${formatDateForICal(endDate)}`,
      `SUMMARY:${escapeICalText(event.title)}`
    ];

    // Add optional fields if they exist
    if (event.description) {
      eventLines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    }
    if (event.location?.name) {
      eventLines.push(`LOCATION:${escapeICalText(event.location.name)}`);
    }
    
    eventLines.push(
      `ORGANIZER;CN=Cool Spring VFD:mailto:${event.created_by_user?.email || 'no-reply@coolspringsvfd.org'}`,
      'END:VEVENT'
    );

    // Add all event lines to the calendar content
    icalContent = icalContent.concat(eventLines);
  });

  // Close the calendar
  icalContent.push('END:VCALENDAR');

  // Join with CRLF as required by iCal spec
  const fileContent = icalContent.join('\r\n');

  // Create and download the file
  const blob = new Blob([fileContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = 'cool-spring-events.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
};

export const generateGoogleCalendarUrl = (events: Event[]): string => {
  if (events.length === 0) {
    throw new Error('No events to add to Google Calendar');
  }

  const event = events[0];
  
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const title = `&text=${encodeURIComponent(event.title)}`;
  const dates = `&dates=${formatDateForGoogle(event.start_time)}/${formatDateForGoogle(event.end_time)}`;
  const details = event.description ? `&details=${encodeURIComponent(event.description)}` : '';
  const location = event.location?.name ? `&location=${encodeURIComponent(event.location.name)}` : '';
  
  return `${base}${title}${dates}${details}${location}`;
};

const formatDateForGoogle = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toISOString().replace(/-|:|\.\d+/g, '');
}; 