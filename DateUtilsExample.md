# Date Utilities Usage Guide

This guide demonstrates how to use the new date utilities to replace existing date formatting code throughout the application.

## Available Utilities

The `src/utils/dateUtils.ts` module provides the following standardized date utilities:

```typescript
// Constants
DEFAULT_TIMEZONE = 'America/New_York'
DATE_FORMATS = { /* various format strings */ }

// Core formatting functions
formatDateTime(date, format?, timezone?)
formatDateForDisplay(date)
formatTimeForDisplay(date)
formatDateTimeForDisplay(date)
formatDateForApi(date)
formatToRFC3339(date)

// Parsing and manipulation
parseApiDate(dateString)
combineDateAndTime(date, time, timezone?)
getCurrentDateTime(timezone?)
isSameDay(date1, date2)
```

## Migration Examples

### Example 1: Replace inline date formatting

**Before:**
```typescript
// Format a date for display
const displayDate = formatInTimeZone(
  parseISO(event.start_time), 
  'America/New_York', 
  'MMM d, yyyy'
);

// Format a time for display
const displayTime = formatInTimeZone(
  parseISO(event.start_time), 
  'America/New_York', 
  'h:mm a'
);
```

**After:**
```typescript
// Import the utilities
import { formatDateForDisplay, formatTimeForDisplay } from '../utils/dateUtils';

// Format a date for display
const displayDate = formatDateForDisplay(event.start_time);

// Format a time for display
const displayTime = formatTimeForDisplay(event.start_time);
```

### Example 2: Replace custom date formatting functions

**Before:**
```typescript
const formatDateTime = (isoString: string) => {
  try {
    return formatInTimeZone(parseISO(isoString), TIMEZONE, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const formatDate = (isoString: string) => {
  try {
    return formatInTimeZone(parseISO(isoString), TIMEZONE, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};
```

**After:**
```typescript
import { formatDateTimeForDisplay, formatDateForDisplay } from '../utils/dateUtils';

const formatDateTime = formatDateTimeForDisplay;
const formatDate = formatDateForDisplay;
```

### Example 3: Replace RFC3339 formatting for API calls

**Before:**
```typescript
// Format dates to RFC3339
const formatToRFC3339 = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toISOString();
};

// In API call
body: JSON.stringify({
  start: {
    dateTime: formatToRFC3339(event.start),
    timeZone: 'America/New_York',
  },
  end: {
    dateTime: formatToRFC3339(event.end),
    timeZone: 'America/New_York',
  },
}),
```

**After:**
```typescript
import { formatToRFC3339, DEFAULT_TIMEZONE } from '../utils/dateUtils';

// In API call
body: JSON.stringify({
  start: {
    dateTime: formatToRFC3339(event.start),
    timeZone: DEFAULT_TIMEZONE,
  },
  end: {
    dateTime: formatToRFC3339(event.end),
    timeZone: DEFAULT_TIMEZONE,
  },
}),
```

### Example 4: Replace timezone date creation

**Before:**
```typescript
import { toDate } from 'date-fns-tz';

// Convert local dates to UTC while preserving the intended time in ET
const eventDate = toDate(
  `${formData.eventDate}T${formData.startTime}`,
  { timeZone: TIMEZONE }
);
```

**After:**
```typescript
import { combineDateAndTime } from '../utils/dateUtils';

// Combine date and time in the correct timezone
const eventDate = combineDateAndTime(
  formData.eventDate,
  formData.startTime
);
```

## Implementation Strategy

1. **Identify code:** Search for instances of date-fns, date-fns-tz, and custom date formatting.
2. **Import utilities:** Add imports for the date utilities at the top of the file.
3. **Replace code:** Update date formatting and parsing logic to use the standardized utilities.
4. **Test changes:** Verify that the formatting looks correct and timezone handling works as expected.

Target files for migration:
- `src/components/SignUpSheet.tsx`
- `src/components/BookingCalendar.tsx`
- `src/components/EventEditor.tsx`
- `src/services/googleCalendar.ts`
- `src/services/bookingService.ts`

## Benefits of Standardized Date Utilities

- **Consistency:** Same formatting across the application
- **Maintainability:** Centralized date handling logic 
- **Error Handling:** Robust error handling in a single place
- **Testability:** Easier to test date handling with isolated utilities
- **Documentation:** Well-documented utilities with clear purposes 