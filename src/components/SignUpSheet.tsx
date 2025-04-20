import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { SignUpConfirmation } from './SignUpConfirmation';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { createCalendarEvent, deleteCalendarEvent } from '../services/googleCalendar';
import { deleteEvent, createEvent } from '../services/bookingService';

// Constants
const TIMEZONE = 'America/New_York';

interface SiteUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthUser {
  email: string;
}

interface SiteUserWithAuth {
  id: string;
  name: string;
  role: string;
  auth: AuthUser | null;
}

interface SignUpPosition {
  name: string;
  member?: string;
  note?: string;
  remindMe?: boolean;
}

interface SignUpSheetGroup {
  name: string;
  positions: SignUpPosition[];
}

interface Position {
  name: string;
  maxSlots: number; // -1 or 0 for unlimited, positive number for specific limit
  members: {
    id: string;
    note?: string;
    remindMe?: boolean;
  }[];
}

interface Group {
  name: string;
  positions: Position[];
}

interface SignUpSheet {
  id?: string;
  title: string;
  status: 'Online' | 'Offline';
  event_date: string;
  start_time: string;
  end_time: string;
  sign_up_by: string;
  pointOfContact: string[];
  allowNotes: boolean;
  allowRemoval: boolean;
  displaySlotNumbers: boolean;
  pushToCalendar: boolean;
  memo: string;
  groups: Group[];
  createdAt?: string;
  createdBy?: string;
}

interface FormData {
  title: string;
  status: 'Online' | 'Offline';
  eventDate: string;
  startTime: string;
  endTime: string;
  signUpBy: string;
  pointOfContact: string[];
  location_id: string;
  pushToCalendar: boolean;
  memo: string;
  groups: Group[];
}

interface SignUpConfirmationSheet {
  id?: string;
  title: string;
  signUpBy: string;
  groups?: Group[];
}

export function SignUpSheetList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signupSheets, setSignupSheets] = useState<SignUpSheet[]>([]);
  const [pastSignupSheets, setPastSignupSheets] = useState<SignUpSheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');
  const { user, role } = useAuth();

  useEffect(() => {
    fetchSignupSheets();
  }, []);

  const fetchSignupSheets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current date in ISO format
      const now = new Date().toISOString();
      
      // Fetch all signup sheets
      const { data: sheetsData, error: sheetsError } = await supabase
        .from('signup_sheets')
        .select('*')
        .order('event_date', { ascending: false });

      if (sheetsError) throw sheetsError;

      // Then, fetch all users to map point of contact IDs to user data
      const { data: usersData, error: usersError } = await supabase
        .from('site_users')
        .select('id, name, role, authid');

      if (usersError) throw usersError;

      // Create a map of user IDs to user data for quick lookup
      const userMap = new Map(usersData?.map(user => [user.id, user]));

      // Transform and split the data into current and past sheets
      const transformedData = sheetsData?.map(sheet => ({
        ...sheet,
        groups: sheet.groups || [],
        pointOfContact: (sheet.point_of_contact as string[] || []).map(id => userMap.get(id)?.id || id)
      })) || [];

      // Split sheets into current and past based on sign_up_by date
      const { current, past } = transformedData.reduce(
        (acc, sheet) => {
          if (sheet.sign_up_by >= now) {
            acc.current.push(sheet);
          } else {
            acc.past.push(sheet);
          }
          return acc;
        },
        { current: [] as SignUpSheet[], past: [] as SignUpSheet[] }
      );

      setSignupSheets(current);
      setPastSignupSheets(past);
    } catch (error) {
      console.error('Error fetching signup sheets:', error);
      setError('Failed to load signup sheets. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayedSheets = activeTab === 'current' ? signupSheets : pastSignupSheets;

  return (
    <div className="space-y-6 signup-sheet-list">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Sign Up Sheets</h2>
        {(role === 'admin' || role === 'webmaster' || role === 'member') && activeTab === 'current' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" />
            Create Sign Up Sheet
          </button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'current'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Current Sign-ups
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past Sign-ups
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading sign-up sheets...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-600">
          {error}
        </div>
      ) : displayedSheets.length === 0 ? (
        <div className="text-center py-4 text-gray-600">
          No {activeTab === 'current' ? 'current' : 'past'} sign-up sheets available.
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedSheets.map((sheet) => (
            <SignUpSheetCard 
              key={sheet.id} 
              sheet={sheet} 
              onUpdate={fetchSignupSheets}
              isPast={activeTab === 'past'}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Sign Up Sheet"
      >
        <SignUpSheetForm onSubmit={() => {
          setIsModalOpen(false);
          fetchSignupSheets();
        }} />
      </Modal>
    </div>
  );
}

function SignUpSheetCard({ sheet, onUpdate, isPast }: { sheet: SignUpSheet; onUpdate: () => void; isPast: boolean }) {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [memberData, setMemberData] = useState<Map<string, SiteUser>>(new Map());
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user, role } = useAuth();
  
  // Calculate total slots and filled slots
  const totalSlots = sheet.groups?.reduce((acc, group) => 
    acc + group.positions.reduce((posAcc, pos) => 
      posAcc + (pos.maxSlots === -1 ? 0 : pos.maxSlots), 0
    ), 0) || 0;
  
  const filledSlots = sheet.groups?.reduce((acc, group) => 
    acc + group.positions.reduce((posAcc, pos) => 
      posAcc + (pos.members?.length || 0), 0
    ), 0) || 0;

  // Check if user can delete this sheet
  const canDelete = ['admin', 'webmaster'].includes(role || '') || 
    (role === 'member' && user?.id && sheet.createdBy === user.id);

  const handleDelete = async () => {
    try {
      if (!sheet.id) return;

      // First, get the sign-up sheet with its calendar_id
      const { data: signupSheet, error: fetchError } = await supabase
        .from('signup_sheets')
        .select('calendar_id')
        .eq('id', sheet.id)
        .single();

      if (fetchError) {
        console.error('Error fetching sign-up sheet:', fetchError);
        toast.error('Failed to delete sign-up sheet');
        return;
      }

      // If there's an associated calendar event, delete it first
      if (signupSheet?.calendar_id) {
        try {
          await deleteEvent(signupSheet.calendar_id);
        } catch (error) {
          console.error('Error deleting calendar event:', error);
          toast.error('Failed to delete calendar event');
          return;
        }
      }

      // Then delete the sign-up sheet
      const { error: sheetDeleteError } = await supabase
        .from('signup_sheets')
        .delete()
        .eq('id', sheet.id);

      if (sheetDeleteError) throw sheetDeleteError;

      toast.success('Sign-up sheet deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting sign-up sheet:', error);
      toast.error('Failed to delete sign-up sheet');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const fetchMemberData = async () => {
    const memberIds = sheet.groups?.flatMap(group => 
      group.positions.flatMap(pos => 
        pos.members.map(member => member.id)
      )
    ) || [];

    if (memberIds.length === 0) return;

    try {
      // Get site_users data
      const { data: siteUsers, error: siteError } = await supabase
        .from('site_users')
        .select('id, name, role, authid')
        .in('id', memberIds);

      if (siteError) throw siteError;

      // Transform the data to match our interface
      const transformedData = siteUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: '', // We'll update this with the auth context
        role: user.role
      }));

      const newMemberData = new Map(transformedData.map(user => [user.id, user]));
      setMemberData(newMemberData);
    } catch (error) {
      console.error('Error fetching member data:', error);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [sheet.groups, refreshKey]);

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

  const handleSignUpSuccess = async () => {
    setIsSignUpModalOpen(false);
    await onUpdate();
    setRefreshKey(prev => prev + 1);
    setIsExpanded(true);
  };

  const confirmationSheet = {
    id: sheet.id,
    title: sheet.title,
    signUpBy: sheet.sign_up_by,
    groups: sheet.groups
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-grow">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">{sheet.title}</h3>
              {canDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete sign-up sheet"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {formatDateTime(sheet.event_date)} - {formatInTimeZone(parseISO(sheet.end_time), TIMEZONE, 'h:mm a')}
            </p>
            <p className="text-sm text-gray-600">
              Sign up by: {formatDate(sheet.sign_up_by)}
            </p>
            
            {/* Expandable section for member list */}
            <div className="mt-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                {isExpanded ? 'Hide' : 'Show'} Member List
                <svg
                  className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isExpanded && (
                <div className="mt-4 space-y-4">
                  {sheet.groups?.map((group, groupIndex) => {
                    const positionsWithMembers = group.positions.filter(pos => pos.members.length > 0);
                    if (positionsWithMembers.length === 0) return null;

                    return (
                      <div key={groupIndex} className="border-l-2 border-blue-200 pl-4">
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <ul className="mt-2 space-y-2">
                          {positionsWithMembers.map((position, posIndex) => (
                            <li key={posIndex} className="text-sm">
                              <div className="text-gray-600">
                                {position.name} ({position.members.length}/{position.maxSlots === -1 ? '∞' : position.maxSlots}):
                              </div>
                              {position.members.map((member, memberIndex) => {
                                const memberInfo = memberData.get(member.id);
                                return (
                                  <div key={memberIndex} className="ml-4 mt-1">
                                    <span className="font-medium">
                                      {memberInfo?.name || 'Loading...'}
                                    </span>
                                    {member.note && (
                                      <p className="text-gray-500 text-xs mt-1">
                                        Note: {member.note}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <button
            className={`text-blue-500 hover:text-blue-700 whitespace-nowrap ml-4 ${
              isPast ? 'pointer-events-none opacity-50' : ''
            }`}
            onClick={() => setIsSignUpModalOpen(true)}
            disabled={isPast}
          >
            {isPast ? 'View Only' : 'View / Sign Up'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        title="Sign Up Sheet Details"
      >
        <SignUpConfirmation
          sheet={confirmationSheet}
          onClose={() => setIsSignUpModalOpen(false)}
          onConfirm={handleSignUpSuccess}
        />
      </Modal>

      {/* Delete confirmation dialog */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this sign-up sheet? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function SignUpSheetForm({ onSubmit }: { onSubmit: () => void }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<SiteUser[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    status: 'Online',
    eventDate: '',
    startTime: '',
    endTime: '',
    signUpBy: '',
    pointOfContact: [],
    location_id: '',
    pushToCalendar: false,
    memo: '',
    groups: []
  });
  
  // Add state for announcement creation
  const [createAnnouncement, setCreateAnnouncement] = useState(false);
  const [announcementExpiryDate, setAnnouncementExpiryDate] = useState('');

  const [currentGroup, setCurrentGroup] = useState({
    name: '',
    positions: [] as Position[]
  });

  const [currentPosition, setCurrentPosition] = useState({
    name: '',
    maxSlots: 1
  });

  useEffect(() => {
    fetchMembers();
    fetchLocations();
  }, []);

  // Calculate minimum date for announcement expiration (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minExpiryDate = tomorrow.toISOString().split('T')[0];
  
  // Default expiration date for announcement (event date)
  useEffect(() => {
    if (formData.eventDate) {
      setAnnouncementExpiryDate(formData.eventDate);
    }
  }, [formData.eventDate]);

  const fetchMembers = async () => {
    try {
      // Get site_users data
      const { data: siteUsers, error: siteError } = await supabase
        .from('site_users')
        .select('id, name, role, authid')
        .order('name');

      if (siteError) throw siteError;

      // Transform the data to match our interface
      const transformedData = siteUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: '', // We don't need email for the dropdown
        role: user.role
      }));

      setMembers(transformedData);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');

      if (locationsError) throw locationsError;
      setLocations(locationsData || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.id) {
        throw new Error('No user found');
      }

      // Validate announcement expiry date if creating announcement
      if (createAnnouncement && !announcementExpiryDate) {
        throw new Error('Please select an expiration date for the announcement');
      }

      // Get the site_user record using the auth ID
      const { data: siteUser, error: userError } = await supabase
        .from('site_users')
        .select('id')
        .eq('authid', user.id)
        .single();

      if (userError) throw userError;

      // Convert local dates to UTC while preserving the intended time in ET
      const eventDate = toDate(
        `${formData.eventDate}T${formData.startTime}`,
        { timeZone: TIMEZONE }
      );
      
      const endDate = toDate(
        `${formData.eventDate}T${formData.endTime}`,
        { timeZone: TIMEZONE }
      );

      // For sign up by date, set it to midnight (00:00) of the selected date in ET
      const signUpByDate = toDate(
        `${formData.signUpBy}T00:00:00.000`,
        { timeZone: TIMEZONE }
      );

      // Validate dates
      if (isNaN(eventDate.getTime()) || isNaN(endDate.getTime()) || isNaN(signUpByDate.getTime())) {
        throw new Error('Invalid date format');
      }

      // Validate that we have at least one group with positions
      if (formData.groups.length === 0) {
        throw new Error('Please add at least one group with positions');
      }

      // Ensure all groups have valid positions
      const validGroups = formData.groups.every(group => 
        group.name && group.positions.length > 0 && 
        group.positions.every(pos => pos.name)
      );

      if (!validGroups) {
        throw new Error('All groups must have a name and at least one position with a name');
      }

      // Get location name if location_id is provided
      let locationName = '';
      if (formData.location_id) {
        const { data: location } = await supabase
          .from('locations')
          .select('name')
          .eq('id', formData.location_id)
          .single();
        if (location) {
          locationName = location.name;
        }
      }

      // Create an event in the events table using bookingService
      const calendarEvent = await createEvent({
        title: formData.title,
        description: formData.memo || '',
        location_id: formData.location_id,
        start_time: eventDate.toISOString(),
        end_time: endDate.toISOString(),
        is_public: true
      });

      // Create the sign-up sheet with the calendar_id reference
      const { data: signupSheet, error } = await supabase
        .from('signup_sheets')
        .insert([{
          title: formData.title,
          status: formData.status,
          event_date: eventDate.toISOString(),
          start_time: eventDate.toISOString(),
          end_time: endDate.toISOString(),
          sign_up_by: signUpByDate.toISOString(),
          point_of_contact: formData.pointOfContact,
          location_id: formData.location_id || null,
          push_to_calendar: formData.pushToCalendar,
          memo: formData.memo,
          groups: formData.groups,
          created_by: user.id,
          calendar_id: calendarEvent.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      // If user opted to create an announcement, create it now
      if (createAnnouncement) {
        const formattedDate = formatInTimeZone(eventDate, TIMEZONE, 'MMM d, yyyy h:mm a');
        const formattedEndTime = formatInTimeZone(endDate, TIMEZONE, 'h:mm a');
        const locationText = locationName ? ` at ${locationName}` : '';
        
        // Create HTML content for better formatting
        const announcementContent = 
          `<p><strong>A new sign-up sheet has been created!</strong></p>` +
          `<p><strong>Event:</strong> ${formData.title}</p>` +
          `<p><strong>Date:</strong> ${formattedDate} - ${formattedEndTime}${locationText}</p>` +
          `<p><strong>Sign up by:</strong> ${formatInTimeZone(signUpByDate, TIMEZONE, 'MMM d, yyyy')}</p>` +
          (formData.memo ? `<p><strong>Additional information:</strong> ${formData.memo}</p>` : '') + 
          `<p class="mt-4"><a href="#signup-sheets" onclick="document.getElementById('signup-sheets').scrollIntoView({behavior: 'smooth'}); return false;" 
           style="display: inline-block; padding: 8px 16px; background-color: #3490dc; color: white; text-decoration: none; border-radius: 4px;">
           View & Sign Up</a></p>`;
          
        const { error: announcementError } = await supabase.from('member_announcements').insert([
          {
            title: `New Sign-Up Sheet: ${formData.title}`,
            content: announcementContent,
            expires_at: new Date(announcementExpiryDate).toISOString(),
            user_id: user.id,
            created_by: user.email
          }
        ]);
        
        if (announcementError) {
          console.error('Error creating announcement:', announcementError);
          toast.error('Sign-up sheet created but failed to create announcement');
        } else {
          toast.success('Sign-up sheet and announcement created successfully');
        }
      } else {
        toast.success('Sign-up sheet created successfully');
      }

      console.log('Created signup sheet:', signupSheet);
      onSubmit();
    } catch (error) {
      console.error('Error creating sign-up sheet:', error);
      alert(error instanceof Error ? error.message : 'Failed to create sign-up sheet. Please check all fields are filled correctly.');
    }
  };

  const addPosition = () => {
    if (!currentPosition.name) return;
    
    setCurrentGroup(prev => ({
      ...prev,
      positions: [...prev.positions, {
        name: currentPosition.name,
        maxSlots: currentPosition.maxSlots,
        members: []
      }]
    }));
    setCurrentPosition({ name: '', maxSlots: 1 });
  };

  const removePosition = (index: number) => {
    setCurrentGroup(prev => ({
      ...prev,
      positions: prev.positions.filter((_, i) => i !== index)
    }));
  };

  const addGroup = () => {
    if (!currentGroup.name) return;
    setFormData(prev => ({
      ...prev,
      groups: [...prev.groups, { ...currentGroup }]
    }));
    setCurrentGroup({ name: '', positions: [] });
  };

  const removeGroup = (index: number) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.status}
          onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as 'Online' | 'Offline' }))}
        >
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Event Date</label>
          <input
            type="date"
            required
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.eventDate}
            onChange={e => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Sign Up By</label>
          <input
            type="date"
            required
            min={new Date().toISOString().split('T')[0]}
            max={formData.eventDate}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.signUpBy}
            onChange={e => setFormData(prev => ({ ...prev, signUpBy: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time</label>
          <div className="flex gap-2">
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.startTime.split(':')[0] || ''}
              onChange={e => {
                const hour = e.target.value.padStart(2, '0');
                const minutes = formData.startTime.split(':')[1] || '00';
                const newTime = `${hour}:${minutes}`;
                setFormData(prev => ({
                  ...prev,
                  startTime: newTime,
                  // Reset end time if it's now invalid
                  endTime: prev.endTime && newTime >= prev.endTime ? newTime : prev.endTime
                }));
              }}
            >
              <option value="">Hour</option>
              {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                <option key={hour} value={hour.toString().padStart(2, '0')}>
                  {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </option>
              ))}
            </select>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.startTime.split(':')[1] || ''}
              onChange={e => {
                const hour = formData.startTime.split(':')[0] || '00';
                const newTime = `${hour}:${e.target.value}`;
                setFormData(prev => ({
                  ...prev,
                  startTime: newTime,
                  // Reset end time if it's now invalid
                  endTime: prev.endTime && newTime >= prev.endTime ? newTime : prev.endTime
                }));
              }}
            >
              <option value="">Min</option>
              <option value="00">00</option>
              <option value="30">30</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Time</label>
          <div className="flex gap-2">
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.endTime.split(':')[0] || ''}
              onChange={e => {
                const hour = e.target.value.padStart(2, '0');
                const minutes = formData.endTime.split(':')[1] || '00';
                setFormData(prev => ({ ...prev, endTime: `${hour}:${minutes}` }));
              }}
            >
              <option value="">Hour</option>
              {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                const hourStr = hour.toString().padStart(2, '0');
                const startHour = formData.startTime.split(':')[0] || '00';
                const startMinutes = formData.startTime.split(':')[1] || '00';
                const isDisabled = hourStr < startHour || 
                  (hourStr === startHour && formData.endTime.split(':')[1] <= startMinutes);
                
                return (
                  <option key={hour} value={hourStr} disabled={isDisabled}>
                    {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </option>
                );
              })}
            </select>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.endTime.split(':')[1] || ''}
              onChange={e => {
                const hour = formData.endTime.split(':')[0] || '00';
                const newMinutes = e.target.value;
                const startHour = formData.startTime.split(':')[0] || '00';
                const startMinutes = formData.startTime.split(':')[1] || '00';
                
                // Only allow setting minutes if they result in a valid end time
                if (hour > startHour || (hour === startHour && newMinutes > startMinutes)) {
                  setFormData(prev => ({ ...prev, endTime: `${hour}:${newMinutes}` }));
                }
              }}
            >
              <option value="">Min</option>
              <option 
                value="00" 
                disabled={
                  formData.endTime.split(':')[0] === formData.startTime.split(':')[0] && 
                  formData.startTime.split(':')[1] === '30'
                }
              >
                00
              </option>
              <option 
                value="30"
                disabled={
                  formData.endTime.split(':')[0] === formData.startTime.split(':')[0] && 
                  formData.startTime.split(':')[1] === '30'
                }
              >
                30
              </option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Point of Contact</label>
        <select
          multiple
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.pointOfContact}
          onChange={e => {
            const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
            setFormData(prev => ({ ...prev, pointOfContact: selectedOptions }));
          }}
        >
          {members.map(member => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple contacts</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.location_id}
            onChange={e => setFormData(prev => ({ ...prev, location_id: e.target.value }))}
          >
            <option value="">Select a location</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Push to Calendar</label>
          <div className="mt-2">
            <input
              type="checkbox"
              id="pushToCalendar"
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              checked={formData.pushToCalendar}
              onChange={e => setFormData(prev => ({ ...prev, pushToCalendar: e.target.checked }))}
            />
            <label htmlFor="pushToCalendar" className="ml-2 text-sm text-gray-700">
              Create Google Calendar event
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Memo</label>
        <textarea
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
          value={formData.memo}
          onChange={e => setFormData(prev => ({ ...prev, memo: e.target.value }))}
        />
      </div>

      {/* Add announcement creation option */}
      <div className="pt-4 border-t">
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id="createAnnouncement"
            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            checked={createAnnouncement}
            onChange={e => setCreateAnnouncement(e.target.checked)}
          />
          <label htmlFor="createAnnouncement" className="ml-2 text-sm font-medium text-gray-700">
            Create a member announcement for this sign-up sheet
          </label>
        </div>
        
        {createAnnouncement && (
          <div className="ml-6 mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Announcement Expiration Date
            </label>
            <input
              type="date"
              min={minExpiryDate}
              value={announcementExpiryDate}
              onChange={e => setAnnouncementExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
              required={createAnnouncement}
            />
            <p className="mt-1 text-xs text-gray-500">
              The announcement will be automatically hidden after this date. By default, it expires on the event date.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Groups</h4>
          {formData.groups.map((group, index) => (
            <div key={index} className="mb-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h5 className="font-medium">{group.name}</h5>
                <button
                  type="button"
                  onClick={() => removeGroup(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                {group.positions.map((position, posIndex) => (
                  <div key={posIndex} className="flex items-center gap-2">
                    <span className="text-sm">Position {posIndex + 1}:</span>
                    <span>{position.name}</span>
                    <span className="text-gray-500">
                      ({position.maxSlots === -1 ? 'Unlimited slots' : 
                        `${position.maxSlots} slot${position.maxSlots !== 1 ? 's' : ''}`})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border p-4 rounded-lg">
          <h4 className="font-medium mb-2">Add New Group</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Group Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={currentGroup.name}
                onChange={e => setCurrentGroup(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {currentGroup.positions.map((position, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm">Position {index + 1}:</span>
                <span>{position.name}</span>
                <span className="text-gray-500">
                  ({position.maxSlots === -1 ? 'Unlimited slots' : 
                    `${position.maxSlots} slot${position.maxSlots !== 1 ? 's' : ''}`})
                </span>
                <button
                  type="button"
                  onClick={() => removePosition(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700">Position Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={currentPosition.name}
                    onChange={e => setCurrentPosition(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Driver, Crew, Traffic Control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Slots</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={currentPosition.maxSlots}
                    onChange={e => setCurrentPosition(prev => ({ 
                      ...prev, 
                      maxSlots: parseInt(e.target.value) 
                    }))}
                  >
                    <option value="-1">Unlimited</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={addPosition}
                disabled={!currentPosition.name}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Add Position
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addGroup}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                disabled={!currentGroup.name || currentGroup.positions.length === 0}
              >
                Add Group
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Sign-Up Sheet
        </button>
      </div>
    </form>
  );
} 