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
import { format, addHours } from 'date-fns';
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

const defaultFormData: EventFormData = {
  title: '',
  description: '',
  start_time: new Date().toISOString(),
  end_time: addHours(new Date(), 1).toISOString(),
  location_id: '',
  is_public: true
};

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
  const [formData, setFormData] = useState<EventFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { user, role, siteUser } = useAuth();

  // Fetch locations when component mounts
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const { data: locations, error } = await supabase
          .from('locations')
          .select('*')
          .order('name');

        if (error) throw error;
        setLocations(locations || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast.error('Failed to load locations');
      }
    };

    if (isOpen) {
      loadLocations();
    }
  }, [isOpen]);

  // Helper function to safely format dates
  const safeFormat = (dateString: string, formatString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      return format(date, formatString);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  useEffect(() => {
    const loadEventData = async () => {
      if (event?.id) {
        try {
          // Fetch event with location data in a single query
          const { data: eventData, error } = await supabase
            .from('events')
            .select(`
              *,
              locations (
                id,
                name
              )
            `)
            .eq('id', event.id)
            .single();

          if (error) throw error;
          if (!eventData) throw new Error('Event not found');

          // Ensure we have valid dates
          const startDate = new Date(eventData.start_time);
          const endDate = new Date(eventData.end_time);

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date values in event');
          }

          console.log('Loading event data:', eventData);

          const newFormData: EventFormData = {
            title: eventData.title || '',
            description: eventData.description || '',
            start_time: eventData.start_time,
            end_time: eventData.end_time,
            location_id: eventData.location_id || '',
            is_public: eventData.is_public !== undefined ? eventData.is_public : true
          };
          
          console.log('Setting form data with location:', newFormData.location_id);
          setFormData(newFormData);
          setIsReady(true);
        } catch (error) {
          console.error('Error loading event:', error);
          toast.error('Error loading event details');
          onClose();
        }
      } else if (date) {
        setFormData({
          ...defaultFormData,
          start_time: date.toISOString(),
          end_time: addHours(date, 1).toISOString()
        });
        setIsReady(true);
      } else {
        setFormData(defaultFormData);
        setIsReady(true);
      }
    };

    if (isOpen) {
      loadEventData();
    } else {
      setFormData(defaultFormData);
      setIsReady(false);
    }
  }, [event?.id, date, isOpen, onClose]);

  // Add debug logging for locations and form data
  useEffect(() => {
    console.log('Current locations:', locations);
    console.log('Current form data:', formData);
  }, [locations, formData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    setIsSubmitting(true);
    try {
      if (event) {
        // Check if user has permission to edit
        const isAdminOrWebmaster = ['admin', 'webmaster'].includes(role || '');
        const isCreator = event.created_by === user.id;

        if (!isAdminOrWebmaster && !isCreator) {
          toast.error('You do not have permission to edit this event');
          return;
        }

        const updatedEvent = await updateEvent(event.id, {
          ...formData,
          created_by: event.created_by // Keep the original creator
        });
        
        if (onEventUpdated) onEventUpdated(updatedEvent);
        toast.success('Event updated successfully');
      } else {
        const newEvent = await createEvent({
          ...formData,
          created_by: user.id
        });
        
        if (onEventCreated) onEventCreated(newEvent);
        toast.success('Event created successfully');
      }
      onClose();
    } catch (error) {
      console.error('Error submitting event:', error);
      toast.error('Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id || !user?.id || !siteUser?.id) return;
    
    const isAdminOrWebmaster = ['admin', 'webmaster'].includes(role || '');
    const isCreator = event.created_by === siteUser.id;

    if (!isAdminOrWebmaster && !isCreator) {
      toast.error('You do not have permission to delete this event');
      return;
    }

    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    if (!event?.id || !user?.id || !siteUser?.id) return;
    
    setIsSubmitting(true);
    try {
      await deleteEvent(event.id);
      toast.success('Event deleted successfully');
      if (onEventDeleted) onEventDeleted(event.id);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const cancelDelete = () => {
    console.log('[DEBUG] cancelDelete: Canceling event deletion');
    setShowDeleteConfirm(false);
  };

  // Only admins and webmasters can modify location settings
  const canEditLocations = ['admin', 'webmaster'].includes(role || '');

  // Update the canDelete condition
  const canDelete = event && (
    ['admin', 'webmaster'].includes(role || '') || 
    (siteUser?.id && event.created_by === siteUser.id)
  );

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={onClose}
        key={`event-editor-${event?.id || 'new'}-${date?.toISOString() || 'no-date'}-${isOpen}`}
      >
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            <DialogDescription>
              {event ? 'Edit the event details below.' : 'Fill in the details to create a new event.'}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
                          {safeFormat(formData.start_time, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={new Date(formData.start_time)}
                          onSelect={(date) => {
                            if (date) {
                              const currentStart = new Date(formData.start_time);
                              const newDate = new Date(date);
                              newDate.setHours(currentStart.getHours());
                              newDate.setMinutes(currentStart.getMinutes());
                              setFormData((prev) => ({
                                ...prev,
                                start_time: newDate.toISOString()
                              }));
                            }
                          }}
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
                    value={safeFormat(formData.start_time, 'HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const newDate = new Date(formData.start_time);
                      newDate.setHours(hours);
                      newDate.setMinutes(minutes);
                      setFormData((prev) => ({
                        ...prev,
                        start_time: newDate.toISOString()
                      }));
                    }}
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
                          {safeFormat(formData.end_time, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={new Date(formData.end_time)}
                          onSelect={(date) => {
                            if (date) {
                              const currentEnd = new Date(formData.end_time);
                              const newDate = new Date(date);
                              newDate.setHours(currentEnd.getHours());
                              newDate.setMinutes(currentEnd.getMinutes());
                              setFormData((prev) => ({
                                ...prev,
                                end_time: newDate.toISOString()
                              }));
                            }
                          }}
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
                    value={safeFormat(formData.end_time, 'HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const newDate = new Date(formData.end_time);
                      newDate.setHours(hours);
                      newDate.setMinutes(minutes);
                      setFormData((prev) => ({
                        ...prev,
                        end_time: newDate.toISOString()
                      }));
                    }}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location_id">Location</Label>
                <Select
                  name="location_id"
                  value={formData.location_id || undefined}
                  onValueChange={(value) => {
                    console.log('Selected location:', value);
                    setFormData((prev) => ({ ...prev, location_id: value }));
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location">
                      {locations.find(loc => loc.id === formData.location_id)?.name}
                    </SelectValue>
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_public: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_public">Make this event public</Label>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              {event && canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : event ? 'Update' : 'Create'}
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
            <Button variant="destructive" onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 