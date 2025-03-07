export interface Location {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  created_by: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  location_id: string;
  start_time: string;
  end_time: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  location?: Location;
  created_by_user?: {
    email: string;
  };
  gcal_event_id?: string;
}

export interface EventFormData {
  title: string;
  description: string;
  start_time: string;  // ISO format date string
  end_time: string;    // ISO format date string
  location_id: string;
  is_public: boolean;
  created_by?: string;  // Make it optional since it's added during submission
}

export interface CalendarEventDisplay {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    description: string;
    locationName: string;
    locationId: string;
    createdBy?: string;
  };
} 