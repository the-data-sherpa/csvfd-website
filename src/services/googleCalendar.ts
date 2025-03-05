import * as jose from 'jose';

export const CALENDAR_ID = 'c_09e207f03a766a994be1825708facc96af8fa61e17ae808977859925ce1c3fa6@group.calendar.google.com';
const SERVICE_ACCOUNT_EMAIL = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

interface CalendarEvent {
  id?: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

let onCalendarUpdate: (() => void) | null = null;

export function setCalendarUpdateCallback(callback: () => void) {
  onCalendarUpdate = callback;
}

async function getAccessToken() {
  try {
    if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
      throw new Error('Service account credentials not configured');
    }

    const now = Math.floor(Date.now() / 1000);
    const claims = {
      iss: SERVICE_ACCOUNT_EMAIL,
      sub: SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/calendar.events',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    console.log('JWT Claims:', claims); // Debug log

    const privateKey = await jose.importPKCS8(PRIVATE_KEY, 'RS256');
    const jwt = await new jose.SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .sign(privateKey);

    console.log('Generated JWT:', jwt); // Debug log

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Token Error:', error);
      throw new Error(`Failed to get access token: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

export async function createCalendarEvent(event: CalendarEvent) {
  try {
    const accessToken = await getAccessToken();
    console.log('Got access token:', accessToken);

    // Format dates to RFC3339
    const formatToRFC3339 = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toISOString();
    };

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
          dateTime: formatToRFC3339(event.start),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: formatToRFC3339(event.end),
          timeZone: 'America/New_York',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Calendar API Error:', error);
      const errorMessage = error.error?.message || 'Failed to create event';
      console.log('Request payload:', {
        summary: event.title,
        start: formatToRFC3339(event.start),
        end: formatToRFC3339(event.end),
      });
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Event created:', result);
    
    // Call the update callback if it exists
    if (onCalendarUpdate) {
      onCalendarUpdate();
    }
    
    return result;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

export async function listCalendarEvents() {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?timeMin=${new Date().toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Calendar API Error:', error);
      throw new Error(error.error?.message || 'Failed to list events');
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing calendar events:', error);
    throw error;
  }
}

export async function updateCalendarEvent(eventId: string, event: CalendarEvent) {
  try {
    const accessToken = await getAccessToken();
    
    const formatToRFC3339 = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toISOString();
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          location: event.location,
          start: {
            dateTime: formatToRFC3339(event.start),
            timeZone: 'America/New_York',
          },
          end: {
            dateTime: formatToRFC3339(event.end),
            timeZone: 'America/New_York',
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Calendar API Error:', error);
      throw new Error(error.error?.message || 'Failed to update event');
    }

    const result = await response.json();
    console.log('Event updated:', result);
    
    if (onCalendarUpdate) {
      onCalendarUpdate();
    }
    
    return result;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(eventId: string) {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Calendar API Error:', error);
      throw new Error(error.error?.message || 'Failed to delete event');
    }

    console.log('Event deleted successfully');
    
    if (onCalendarUpdate) {
      onCalendarUpdate();
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

export async function getCalendarEvent(eventId: string) {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${eventId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Calendar API Error:', error);
      throw new Error(error.error?.message || 'Failed to get event');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting calendar event:', error);
    throw error;
  }
}