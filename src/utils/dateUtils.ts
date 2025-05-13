import { format, parse, isValid } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { formatISO } from 'date-fns/formatISO';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Application default timezone
 */
export const DEFAULT_TIMEZONE = 'America/New_York';

/**
 * Common date format strings
 */
export const DATE_FORMATS = {
  API_DATE: 'yyyy-MM-dd',
  API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  DISPLAY_DATE: 'MMM d, yyyy',
  DISPLAY_TIME: 'h:mm a',
  DISPLAY_DATETIME: 'MMM d, yyyy h:mm a',
  CALENDAR_DATE: 'yyyy-MM-dd',
  DAY_OF_WEEK: 'EEEE',
  MONTH_YEAR: 'MMMM yyyy',
};

/**
 * Formats a date for display using the application's default timezone
 * 
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @param formatString - Format string (from DATE_FORMATS or custom)
 * @param timezone - Optional timezone (defaults to application default)
 * @returns Formatted date string
 */
export function formatDateTime(
  date: Date | string | number,
  formatString: string = DATE_FORMATS.DISPLAY_DATETIME,
  timezone: string = DEFAULT_TIMEZONE
): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    
    if (!isValid(dateObj)) {
      console.warn('Invalid date provided to formatDateTime:', date);
      return '';
    }
    
    return formatInTimeZone(dateObj, timezone, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Formats a date for display (date only, no time)
 * 
 * @param date - Date to format
 * @returns Formatted date string (e.g. "Jan 1, 2023")
 */
export function formatDateForDisplay(
  date: Date | string | number
): string {
  return formatDateTime(date, DATE_FORMATS.DISPLAY_DATE);
}

/**
 * Formats a time for display
 * 
 * @param date - Date to format
 * @returns Formatted time string (e.g. "3:30 PM")
 */
export function formatTimeForDisplay(
  date: Date | string | number
): string {
  return formatDateTime(date, DATE_FORMATS.DISPLAY_TIME);
}

/**
 * Formats a date and time for display
 * 
 * @param date - Date to format
 * @returns Formatted date and time string (e.g. "Jan 1, 2023 3:30 PM")
 */
export function formatDateTimeForDisplay(
  date: Date | string | number
): string {
  return formatDateTime(date, DATE_FORMATS.DISPLAY_DATETIME);
}

/**
 * Formats a date for API use (ISO format)
 * 
 * @param date - Date to format
 * @returns ISO formatted date string
 */
export function formatDateForApi(
  date: Date | string | number
): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    
    if (!isValid(dateObj)) {
      console.warn('Invalid date provided to formatDateForApi:', date);
      return '';
    }
    
    return formatISO(dateObj);
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return '';
  }
}

/**
 * Formats a date to RFC3339 format for API use (specifically for Google Calendar)
 * 
 * @param date - Date to format
 * @returns RFC3339 formatted date string
 */
export function formatToRFC3339(
  date: Date | string | number
): string {
  return formatDateForApi(date);
}

/**
 * Parses a date string from API
 * 
 * @param dateString - ISO date string to parse
 * @returns Date object in local timezone
 */
export function parseApiDate(
  dateString: string
): Date {
  if (!dateString) return new Date(NaN);
  
  try {
    const dateObj = parseISO(dateString);
    
    if (!isValid(dateObj)) {
      console.warn('Invalid date string provided to parseApiDate:', dateString);
      return new Date(NaN);
    }
    
    return dateObj;
  } catch (error) {
    console.error('Error parsing API date:', error);
    return new Date(NaN);
  }
}

/**
 * Combines date and time values into a single Date object
 * 
 * @param date - Date portion (Date object or string)
 * @param time - Time portion (string in format "HH:mm" or "h:mm a")
 * @param timezone - Optional timezone (defaults to application default)
 * @returns Combined Date object
 */
export function combineDateAndTime(
  date: Date | string,
  time: string,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  if (!date || !time) return new Date(NaN);
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    
    if (!isValid(dateObj)) {
      console.warn('Invalid date provided to combineDateAndTime:', date);
      return new Date(NaN);
    }
    
    // Handle 12-hour format (e.g. "3:30 PM")
    let hours = 0;
    let minutes = 0;
    
    if (time.includes('AM') || time.includes('PM')) {
      const timeParts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeParts) {
        hours = parseInt(timeParts[1], 10);
        minutes = parseInt(timeParts[2], 10);
        
        if (timeParts[3].toUpperCase() === 'PM' && hours < 12) {
          hours += 12;
        } else if (timeParts[3].toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
      }
    } else {
      // Handle 24-hour format (e.g. "15:30")
      const timeParts = time.match(/(\d+):(\d+)/);
      if (timeParts) {
        hours = parseInt(timeParts[1], 10);
        minutes = parseInt(timeParts[2], 10);
      }
    }
    
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    
    return toZonedTime(new Date(year, month, day, hours, minutes, 0, 0), timezone);
  } catch (error) {
    console.error('Error combining date and time:', error);
    return new Date(NaN);
  }
}

/**
 * Gets the current date and time in the application's timezone
 * 
 * @param timezone - Optional timezone (defaults to application default)
 * @returns Current date in specified timezone
 */
export function getCurrentDateTime(
  timezone: string = DEFAULT_TIMEZONE
): Date {
  return toZonedTime(new Date(), timezone);
}

/**
 * Checks if two dates are on the same day
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 */
export function isSameDay(
  date1: Date | string | number,
  date2: Date | string | number
): boolean {
  try {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : new Date(date1);
    const d2 = typeof date2 === 'string' ? parseISO(date2) : new Date(date2);
    
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch (error) {
    console.error('Error comparing dates:', error);
    return false;
  }
} 