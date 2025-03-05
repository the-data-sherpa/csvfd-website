import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Button } from './ui/button';
import { Calendar, Download, PlusCircle, RefreshCw, X } from 'lucide-react';
import { EventEditor } from './EventEditor';
import { Event, CalendarEventDisplay, Location } from '../types/booking';
import { fetchEvents, fetchLocations, exportEventsToICal, generateGoogleCalendarUrl } from '../services/bookingService';
import { toast, Toaster } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

export function BookingCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showEventEditor, setShowEventEditor] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const { user } = useAuth();
  
  // Add state for the view-only event dialog
  const [viewEvent, setViewEvent] = useState<Event | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Add a state variable to track the last event deletion time
  const [lastEventDeletion, setLastEventDeletion] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Add a separate useEffect for user role
  useEffect(() => {
    if (user?.email) {
      console.log('[DEBUG] User changed, fetching role for:', user.email);
      fetchUserRole();
    } else {
      console.log('[DEBUG] No user available, clearing role');
      setUserRole(null);
    }
  }, [user?.email]); // Only re-run when user email changes

  const fetchUserRole = async () => {
    if (!user?.email) {
      console.log('[DEBUG] fetchUserRole: No user email available');
      setUserRole(null);
      return;
    }
    
    console.log('[DEBUG] fetchUserRole: Fetching role for email:', user.email);
    
    try {
      const { data, error } = await supabase
        .from('site_users')
        .select('role')
        .eq('email', user.email)
        .single();
      
      if (error) {
        console.error('[DEBUG] fetchUserRole: Error fetching role:', error);
        // Only set member role if there's a specific "not found" error
        if (error.code === 'PGRST116') {
          console.log('[DEBUG] fetchUserRole: User not found, creating new member record');
          await createNewUserRecord();
        } else {
          console.error('[DEBUG] fetchUserRole: Unexpected error:', error);
          setUserRole(null);
        }
        return;
      }
      
      if (data) {
        console.log('[DEBUG] fetchUserRole: Found role:', data.role);
        setUserRole(data.role);
      }
    } catch (e) {
      console.error('[DEBUG] fetchUserRole: Exception:', e);
      setUserRole(null);
    }
  };

  const createNewUserRecord = async () => {
    if (!user?.email) return;
    
    try {
      const { error: insertError } = await supabase
        .from('site_users')
        .insert([{ email: user.email, role: 'member' }]);
        
      if (insertError) {
        console.error('[DEBUG] createNewUserRecord: Error creating user record:', insertError);
      } else {
        console.log('[DEBUG] createNewUserRecord: Created new site_users record with member role');
        setUserRole('member');
      }
    } catch (e) {
      console.error('[DEBUG] createNewUserRecord: Exception creating user record:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, locationsData] = await Promise.all([
        fetchEvents(),
        fetchLocations()
      ]);
      setEvents(eventsData);
      setLocations(locationsData);
    } catch (error) {
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  // Add a performance measurement utility
  const measurePerformance = (label: string, fn: () => void) => {
    console.log(`[PERF] ${label}: Starting`);
    const startTime = performance.now();
    fn();
    const endTime = performance.now();
    console.log(`[PERF] ${label}: Completed in ${endTime - startTime}ms`);
  };

  const handleCloseEditor = () => {
    console.log('[DEBUG] handleCloseEditor: Closing editor');
    measurePerformance('handleCloseEditor', () => {
      setShowEventEditor(false);
      setSelectedEvent(null);
      setSelectedDate(null);
      setIsCreating(false);
    });
  };

  // Add a new function to handle opening the editor with a small delay if needed
  const openEventEditor = (date: Date | null = null, event: Event | null = null, isNew: boolean = false) => {
    console.log(`[DEBUG] openEventEditor: Opening editor with date=${date}, event=${event?.id}, isNew=${isNew}, showEventEditor=${showEventEditor}`);
    
    // Always close the editor first to ensure a clean state
    console.log('[DEBUG] openEventEditor: Closing editor first to ensure clean state');
    measurePerformance('openEventEditor-close', () => {
      setShowEventEditor(false);
      setSelectedEvent(null);
      setSelectedDate(null);
      setIsCreating(false);
    });
    
    // Use a timeout to ensure the editor is fully closed before reopening
    setTimeout(() => {
      console.log('[DEBUG] openEventEditor: Opening editor with new state');
      measurePerformance('openEventEditor-open', () => {
        setSelectedDate(date);
        setSelectedEvent(event);
        setIsCreating(isNew);
        // Use another small timeout to ensure React has processed the state changes
        setTimeout(() => {
          console.log('[DEBUG] openEventEditor: Setting showEventEditor to true');
          setShowEventEditor(true);
        }, 10);
      });
    }, 50);
  };

  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    const event = events.find(e => e.id === eventId);
    if (event) {
      // If user is admin/webmaster, they can edit any event
      // Otherwise, they can only edit their own events
      const isAdminOrWebmaster = ['admin', 'webmaster'].includes(userRole || '');
      const isCreator = user?.id && user.id === event.created_by;
      
      if (isAdminOrWebmaster || isCreator) {
        openEventEditor(null, event, false);
      } else {
        // Show event details in a custom dialog instead of an alert
        console.log('[DEBUG] handleEventClick: Showing view-only dialog for event', event.id);
        setViewEvent(event);
        setShowViewDialog(true);
      }
    }
  };

  // Add a function to close the view dialog
  const closeViewDialog = () => {
    console.log('[DEBUG] closeViewDialog: Closing view dialog');
    setShowViewDialog(false);
    setViewEvent(null);
  };

  // Add a function to handle creating a new event after viewing an event
  const handleCreateAfterView = () => {
    console.log('[DEBUG] handleCreateAfterView: Creating new event after viewing');
    closeViewDialog();
    
    // Add a delay before opening the editor
    setTimeout(() => {
      openEventEditor(new Date(), null, true);
    }, 300);
  };

  const handleDateClick = (info: any) => {
    console.log('[DEBUG] handleDateClick: Date clicked', info.dateStr);
    console.log('[DEBUG] handleDateClick: Current user role:', userRole);
    console.log('[DEBUG] handleDateClick: User object:', user);
    
    // Check if an event was recently deleted
    const now = Date.now();
    if (lastEventDeletion && now - lastEventDeletion < 500) {
      console.log('[DEBUG] handleDateClick: Recent event deletion detected, adding delay');
      setTimeout(() => {
        openEventEditor(info.date, null, true);
      }, 300);
      return;
    }
    
    // If the view dialog is open, close it first
    if (showViewDialog) {
      console.log('[DEBUG] handleDateClick: View dialog is open, closing first');
      closeViewDialog();
      
      // Add a delay before opening the editor
      setTimeout(() => {
        openEventEditor(info.date, null, true);
      }, 300);
    } else {
      // Always allow creating events
      openEventEditor(info.date, null, true);
    }
  };

  const handleEventCreated = (newEvent: Event) => {
    setEvents(prev => [...prev, newEvent]);
  };

  const handleEventUpdated = (updatedEvent: Event) => {
    setEvents(prev => prev.map(event => event.id === updatedEvent.id ? updatedEvent : event));
  };

  const handleEventDeleted = (eventId: string) => {
    console.log(`[DEBUG] handleEventDeleted: Event deleted with ID ${eventId}`);
    // Remove the deleted event from the events array
    const updatedEvents = events.filter(event => event.id !== eventId);
    console.log(`[DEBUG] handleEventDeleted: Updating events array from ${events.length} to ${updatedEvents.length} events`);
    setEvents(updatedEvents);
    
    // Force a refresh of the calendar
    console.log('[DEBUG] handleEventDeleted: Refreshing calendar');
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.refetchEvents();
    }
    
    // Make sure the editor is fully closed
    console.log('[DEBUG] handleEventDeleted: Ensuring editor is closed');
    handleCloseEditor();
    
    // Show a success message
    toast.success('Event deleted successfully');
    
    // Set the last event deletion time
    setLastEventDeletion(Date.now());
  };

  const handleExportCalendar = () => {
    try {
      if (events.length === 0) {
        toast.error('No events to export');
        return;
      }
      exportEventsToICal(events);
      toast.success('Calendar exported to iCal file');
    } catch (error) {
      toast.error('Failed to export calendar');
    }
  };

  const handleOpenInGoogleCalendar = () => {
    try {
      const url = generateGoogleCalendarUrl(events);
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Failed to open in Google Calendar');
    }
  };

  // Map events for display in calendar
  const mapEventsToCalendar = (): CalendarEventDisplay[] => {
    return events.map(event => {
      const location = locations.find(loc => loc.id === event.location_id);
      return {
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        backgroundColor: location?.color || '#3788d8',
        borderColor: location?.color || '#3788d8',
        textColor: '#ffffff',
        extendedProps: {
          description: event.description || '',
          locationName: location?.name || 'Unknown Location',
          locationId: event.location_id,
          createdBy: event.created_by_user?.email || 'Unknown'
        }
      };
    });
  };

  // Custom render for event content
  const eventContent = (eventInfo: any) => {
    const locationName = eventInfo.event.extendedProps.locationName;
    
    return (
      <>
        <b>{eventInfo.timeText}</b>
        <div className="fc-event-title">{eventInfo.event.title}</div>
        <div className="fc-event-location text-xs">{locationName}</div>
      </>
    );
  };

  return (
    <div className="calendar-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Department Event Calendar</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCalendar}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {user && (
            <Button 
              size="sm" 
              onClick={() => {
                openEventEditor(new Date(), null, true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Event
            </Button>
          )}
        </div>
      </div>
      
      <div className="calendar-wrapper border rounded-md p-2 bg-white">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          events={mapEventsToCalendar()}
          eventContent={eventContent}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          selectable={!!user}
          editable={false}
          height="auto"
        />
      </div>
      
      <EventEditor
        event={selectedEvent}
        date={selectedDate}
        isOpen={showEventEditor}
        onClose={handleCloseEditor}
        onEventCreated={handleEventCreated}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
        key={`event-editor-${selectedEvent?.id || 'new'}-${selectedDate?.toISOString() || 'no-date'}-${showEventEditor}`}
      />
      
      {/* View-only event dialog */}
      <Dialog open={showViewDialog} onOpenChange={closeViewDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <div className="font-medium">Title:</div>
                <div>{viewEvent?.title}</div>
              </div>
              
              <div>
                <div className="font-medium">Description:</div>
                <div>{viewEvent?.description || 'No description provided.'}</div>
              </div>
              
              <div>
                <div className="font-medium">Location:</div>
                <div>{viewEvent?.location?.name || 'No location'}</div>
              </div>
              
              <div>
                <div className="font-medium">Time:</div>
                <div>
                  {viewEvent ? (
                    `${new Date(viewEvent.start_time).toLocaleString()} - ${new Date(viewEvent.end_time).toLocaleString()}`
                  ) : (
                    'Not specified'
                  )}
                </div>
              </div>

              <div>
                <div className="font-medium">Created By:</div>
                <div>{viewEvent?.created_by_user?.email || 'Unknown'}</div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={closeViewDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 