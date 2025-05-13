import { supabase } from '../lib/supabase';
import { Event, EventFormData, Location, CalendarEventDisplay } from '../types/booking';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './googleCalendar';
import { 
  formatDateForDisplay, 
  formatTimeForDisplay, 
  formatDateTimeForDisplay,
  formatToRFC3339,
  DEFAULT_TIMEZONE
} from '../utils/dateUtils';

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

// Replace the formatDateForICal function with our utility
const formatDateForICal = (date: Date): string => {
  // ICal format is a bit different, so we need a custom function
  // Use the date string without dashes or colons
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/g, '');
};

const escapeICalText = (text: string): string => {
  return text
    .replace(/[\\;,]/g, '\\$&')
    .replace(/\r\n|\r|\n/g, '\\n');
};

export const exportEventsToICal = (events: Event[]): void => {
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CSVFD//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach(event => {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    const locationName = event.location?.name || '';
    
    icalContent.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@csvfd`,
      `DTSTAMP:${formatDateForICal(new Date())}Z`,
      `DTSTART:${formatDateForICal(startDate)}Z`,
      `DTEND:${formatDateForICal(endDate)}Z`,
      `SUMMARY:${escapeICalText(event.title)}`,
      `DESCRIPTION:${escapeICalText(event.description || '')}`,
      `LOCATION:${escapeICalText(locationName)}`,
      'END:VEVENT'
    );
  });

  icalContent.push('END:VCALENDAR');
  
  const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'csvfd-events.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateGoogleCalendarUrl = (events: Event[]): string => {
  if (events.length === 0) return '';
  
  // For multiple events, just open Google Calendar in a new tab
  if (events.length > 1) {
    return 'https://calendar.google.com/calendar/';
  }
  
  // For a single event, generate a Google Calendar event URL
  const event = events[0];
  const title = encodeURIComponent(event.title);
  const description = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.location?.name || '');
  
  // Format for Google Calendar URL
  const start = formatDateForGoogle(event.start_time);
  const end = formatDateForGoogle(event.end_time);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&location=${location}&dates=${start}/${end}`;
};

// Google Calendar requires a specific format without punctuation
const formatDateForGoogle = (dateStr: string): string => {
  return formatDateForICal(new Date(dateStr));
}; 