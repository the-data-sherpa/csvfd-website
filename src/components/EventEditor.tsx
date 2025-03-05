import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CalendarIcon, Trash, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { Event, EventFormData, Location } from '../types/booking';
import { createEvent, updateEvent, deleteEvent, fetchLocations } from '../services/bookingService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface EventEditorProps {
  event?: Event | null;
  date?: Date | null;
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (event: Event) => void;
  onEventUpdated?: (event: Event) => void;
  onEventDeleted?: (eventId: string) => void;
}

export function EventEditor({
  event,
  date,
  isOpen,
  onClose,
  onEventCreated,
  onEventUpdated,
  onEventDeleted
}: EventEditorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user } = useAuth();
  const isNewEvent = !event;
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Add state for delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || '',
    description: event?.description || '',
    start_time: event?.start_time || (date ? format(date, "yyyy-MM-dd'T'HH:mm:ssXXX") : ''),
    end_time: event?.end_time || (date ? format(new Date(date.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ssXXX") : ''),
    location_id: event?.location_id || '',
    is_public: event?.is_public ?? true
  });
  const [startDate, setStartDate] = useState<Date | undefined>(
    formData.start_time ? parseISO(formData.start_time) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    formData.end_time ? parseISO(formData.end_time) : undefined
  );

  useEffect(() => {
    let isMounted = true;
    
    if (isOpen) {
      console.log('[DEBUG] EventEditor useEffect: Opening editor', { event: event?.id, date, isNewEvent });
      setIsReady(false);
      
      // Reset form data when opening the editor
      const initialData: EventFormData = {
        title: event?.title || '',
        description: event?.description || '',
        start_time: event?.start_time || (date ? format(date, "yyyy-MM-dd'T'HH:mm:ssXXX") : ''),
        end_time: event?.end_time || (date ? format(new Date(date.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ssXXX") : ''),
        location_id: event?.location_id || '',
        is_public: event?.is_public ?? true
      };
      
      console.log('[DEBUG] EventEditor useEffect: Setting initial form data', initialData);
      if (isMounted) {
        setFormData(initialData);
        setStartDate(initialData.start_time ? parseISO(initialData.start_time) : undefined);
        setEndDate(initialData.end_time ? parseISO(initialData.end_time) : undefined);
      }
      
      // Load data in parallel
      console.log('[DEBUG] EventEditor useEffect: Loading data in parallel');
      Promise.all([
        loadLocations(),
        fetchUserRole()
      ]).then(() => {
        if (isMounted) {
          console.log('[DEBUG] EventEditor useEffect: Data loading complete');
          setIsReady(true);
        }
      }).catch(err => {
        if (isMounted) {
          console.error('[DEBUG] EventEditor useEffect: Error initializing EventEditor:', err);
          setIsReady(true);
        }
      });
    } else {
      console.log('[DEBUG] EventEditor useEffect: Editor closed');
    }
    
    // Cleanup function
    return () => {
      console.log('[DEBUG] EventEditor useEffect: Cleanup function called');
      isMounted = false;
    };
  }, [isOpen, event, date]);

  useEffect(() => {
    if (isReady && isOpen && titleInputRef.current) {
      console.log('[DEBUG] EventEditor focus effect: Setting focus to title input');
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          console.log('[DEBUG] EventEditor focus effect: Focus set to title input');
        }
      }, 50);
    }
  }, [isReady, isOpen]);

  const fetchUserRole = async () => {
    if (!user?.email) return;
    
    console.log('Fetching role for email:', user.email);
    
    try {
      const { data, error } = await supabase
        .from('site_users')
        .select('role')
        .eq('email', user.email)
        .single();
      
      if (data && !error) {
        console.log('Found role in site_users:', data.role);
        setUserRole(data.role);
        return data.role;
      } else {
        console.log('Error fetching user role:', error);
        // Set default role to 'member' if no record is found
        setUserRole('member');
        
        // Optionally, create a record for this user
        try {
          const { error: insertError } = await supabase
            .from('site_users')
            .insert([{ email: user.email, role: 'member' }]);
            
          if (insertError) {
            console.log('Error creating user record:', insertError);
          } else {
            console.log('Created new site_users record with member role');
          }
        } catch (e) {
          console.error('Exception creating user record:', e);
        }
        
        return 'member';
      }
    } catch (e) {
      console.error('Exception in fetchUserRole:', e);
      setUserRole('member');
      return 'member';
    }
  };

  const loadLocations = async () => {
    console.log('Loading locations...');
    try {
      const locationsData = await fetchLocations();
      setLocations(locationsData);
      return locationsData;
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
      return [];
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      // Update the form data with the new date but keep the time
      const currentStart = formData.start_time ? parseISO(formData.start_time) : new Date();
      const newDate = new Date(date);
      newDate.setHours(currentStart.getHours(), currentStart.getMinutes());
      setFormData((prev) => ({
        ...prev,
        start_time: format(newDate, "yyyy-MM-dd'T'HH:mm:ssXXX")
      }));
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setEndDate(date);
      // Update the form data with the new date but keep the time
      const currentEnd = formData.end_time ? parseISO(formData.end_time) : new Date();
      const newDate = new Date(date);
      newDate.setHours(currentEnd.getHours(), currentEnd.getMinutes());
      setFormData((prev) => ({
        ...prev,
        end_time: format(newDate, "yyyy-MM-dd'T'HH:mm:ssXXX")
      }));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const timeField = name === 'startTime' ? 'start_time' : 'end_time';
    const dateValue = timeField === 'start_time' ? startDate : endDate;

    if (dateValue) {
      const [hours, minutes] = value.split(':').map(Number);
      const newDate = new Date(dateValue);
      newDate.setHours(hours, minutes);
      setFormData((prev) => ({
        ...prev,
        [timeField]: format(newDate, "yyyy-MM-dd'T'HH:mm:ssXXX")
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('[DEBUG] handleSubmit: Submitting form with data:', formData);

    try {
      if (isNewEvent) {
        console.log('[DEBUG] handleSubmit: Creating new event...');
        const newEvent = await createEvent(formData);
        console.log('[DEBUG] handleSubmit: Event created successfully:', newEvent);
        toast.success('Event created successfully');
        onEventCreated?.(newEvent);
      } else if (event) {
        console.log('[DEBUG] handleSubmit: Updating existing event...');
        const updatedEvent = await updateEvent(event.id, formData);
        console.log('[DEBUG] handleSubmit: Event updated successfully:', updatedEvent);
        toast.success('Event updated successfully');
        onEventUpdated?.(updatedEvent);
      }
      console.log('[DEBUG] handleSubmit: Closing editor');
      onClose();
    } catch (error) {
      console.error('[DEBUG] handleSubmit: Error in handleSubmit:', error);
      if (error instanceof Error) {
        toast.error(`Failed to save event: ${error.message}`);
      } else {
        toast.error('Failed to save event');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    
    // Show the delete confirmation dialog instead of using window.confirm
    setShowDeleteConfirm(true);
  };
  
  // Add a function to handle the actual deletion after confirmation
  const confirmDelete = async () => {
    if (!event?.id) return;
    
    setLoading(true);
    console.log('[DEBUG] confirmDelete: Deleting event with ID:', event.id);
    try {
      await deleteEvent(event.id);
      console.log('[DEBUG] confirmDelete: Event deleted successfully');
      toast.success('Event deleted successfully');
      
      // Close the delete confirmation dialog
      setShowDeleteConfirm(false);
      
      // Notify parent component about deletion
      onEventDeleted?.(event.id);
      
      console.log('[DEBUG] confirmDelete: Calling onClose');
      onClose();
    } catch (error) {
      console.error('[DEBUG] confirmDelete: Error deleting event:', error);
      toast.error('Failed to delete event');
      
      // Close the delete confirmation dialog even on error
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a function to cancel deletion
  const cancelDelete = () => {
    console.log('[DEBUG] cancelDelete: Canceling event deletion');
    setShowDeleteConfirm(false);
  };

  // Only admins and webmasters can modify location settings
  const canEditLocations = ['admin', 'webmaster'].includes(userRole || '');

  // Only allow deletion if user is admin/webmaster or the event creator
  const canDelete = 
    event ? 
    (['admin', 'webmaster'].includes(userRole || '') || (user?.id && user.id === event.created_by)) 
    : false;

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={onClose}
        key={`event-editor-${event?.id || 'new'}-${date?.toISOString() || 'no-date'}-${isOpen}`}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isNewEvent ? 'Create New Event' : 'Edit Event'}</DialogTitle>
            <DialogDescription>
              {isNewEvent ? 'Fill in the details to create a new event.' : 'Edit the event details below.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  ref={titleInputRef}
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={handleStartDateSelect}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.start_time ? format(parseISO(formData.start_time), 'HH:mm') : ''}
                    onChange={handleTimeChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={handleEndDateSelect}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.end_time ? format(parseISO(formData.end_time), 'HH:mm') : ''}
                    onChange={handleTimeChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location_id">Location</Label>
                <Select
                  name="location_id"
                  value={formData.location_id}
                  onValueChange={(value) => handleSelectChange('location_id', value)}
                  disabled={false}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={(e) => 
                    setFormData((prev) => ({ ...prev, is_public: e.target.checked }))
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="is_public">Make this event public</Label>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              {!isNewEvent && canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : isNewEvent ? 'Create' : 'Update'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add the delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="font-medium">{event?.title}</p>
            {event?.location?.name && (
              <p className="text-sm text-muted-foreground">at {event.location.name}</p>
            )}
            {event?.start_time && (
              <p className="text-sm text-muted-foreground">
                on {new Date(event.start_time).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 