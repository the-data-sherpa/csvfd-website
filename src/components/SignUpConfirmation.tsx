import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTimeForDisplay, formatDateForDisplay, DEFAULT_TIMEZONE } from '../utils';

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

interface SignUpConfirmationProps {
  sheet: {
    id?: string;
    title: string;
    signUpBy: string;
    groups?: Group[];
  };
  onClose: () => void;
  onConfirm: () => void;
}

export function SignUpConfirmation({ sheet, onClose, onConfirm }: SignUpConfirmationProps) {
  const { user, role } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [note, setNote] = useState('');
  const [remindMe, setRemindMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug logging on component mount
  useEffect(() => {
    console.log('SignUpConfirmation mounted with:', {
      sheetId: sheet.id,
      sheetTitle: sheet.title,
      groups: sheet.groups,
      user: {
        id: user?.id,
        role: role
      }
    });
  }, [sheet, user, role]);

  // Get available positions for the selected group
  const availablePositions = selectedGroup
    ? sheet.groups?.find(g => g.name === selectedGroup)?.positions.filter(p => 
        p.maxSlots === -1 || p.maxSlots === 0 || // Unlimited slots
        (p.members?.length || 0) < p.maxSlots // Has available slots
      ) || []
    : [];

  // Debug log when selected group changes
  useEffect(() => {
    if (selectedGroup) {
      console.log('Selected group changed:', {
        group: selectedGroup,
        availablePositions: availablePositions
      });
    }
  }, [selectedGroup, availablePositions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit attempt:', {
      userId: user?.id,
      sheetId: sheet.id,
      selectedGroup,
      selectedPosition,
      note,
      remindMe
    });

    if (!user?.id || !sheet.id || !selectedGroup || !selectedPosition) {
      const error = 'Please select a group and position';
      console.log('Validation failed:', { error });
      setError(error);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Fetching site user data for auth ID:', user.id);
      // First, get the site_user ID using the auth ID
      const { data: siteUser, error: userError } = await supabase
        .from('site_users')
        .select('id, role')
        .eq('authid', user.id)
        .single();

      if (userError) {
        console.error('Error fetching site user:', userError);
        throw userError;
      }

      console.log('Found site user:', siteUser);

      // Find the group and position indices
      const groupIndex = sheet.groups?.findIndex(g => g.name === selectedGroup);
      if (groupIndex === -1 || groupIndex === undefined) {
        const error = 'Selected group not found';
        console.error(error, { selectedGroup, availableGroups: sheet.groups?.map(g => g.name) });
        throw new Error(error);
      }

      const group = sheet.groups?.[groupIndex];
      const positionIndex = group?.positions.findIndex(p => p.name === selectedPosition);
      if (positionIndex === -1 || positionIndex === undefined) {
        const error = 'Selected position not found';
        console.error(error, { 
          selectedPosition, 
          availablePositions: group?.positions.map(p => p.name)
        });
        throw new Error(error);
      }

      console.log('Fetching current sheet data...');
      // Get the current signup sheet to ensure we have the latest data
      const { data: currentSheet, error: fetchError } = await supabase
        .from('signup_sheets')
        .select('groups')
        .eq('id', sheet.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current sheet:', fetchError);
        throw fetchError;
      }

      console.log('Current sheet data:', currentSheet);

      // Verify the position still has available slots
      const position = currentSheet.groups[groupIndex].positions[positionIndex];
      const currentMemberCount = position.members?.length || 0;
      const hasAvailableSlots = position.maxSlots <= 0 || currentMemberCount < position.maxSlots;

      if (!hasAvailableSlots) {
        const error = 'This position has no more available slots';
        console.error(error, {
          groupIndex,
          positionIndex,
          position: currentSheet.groups[groupIndex].positions[positionIndex]
        });
        throw new Error(error);
      }

      // Update the signup sheet with the site_user ID
      const updatedGroups = [...(currentSheet.groups || [])];
      const updatedPosition = {
        ...updatedGroups[groupIndex].positions[positionIndex],
        members: [
          ...(updatedGroups[groupIndex].positions[positionIndex].members || []),
          {
            id: siteUser.id,
            note: note || undefined,
            remindMe
          }
        ]
      };

      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        positions: updatedGroups[groupIndex].positions.map((pos: Position, idx: number) =>
          idx === positionIndex ? updatedPosition : pos
        )
      };

      console.log('Updating sheet with new data:', {
        groupIndex,
        positionIndex,
        updatedPosition
      });

      const { error: updateError } = await supabase
        .from('signup_sheets')
        .update({ groups: updatedGroups })
        .eq('id', sheet.id);

      if (updateError) {
        console.error('Error updating sheet:', updateError);
        throw updateError;
      }

      console.log('Sign-up successful');
      onConfirm();
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug log available groups on render
  const availableGroups = sheet.groups?.filter(group => 
    group.positions.some(p => 
      p.maxSlots === -1 || p.maxSlots === 0 || // Unlimited slots
      (p.members?.length || 0) < p.maxSlots // Has available slots
    )
  ) || [];

  console.log('Rendering with available groups:', {
    totalGroups: sheet.groups?.length || 0,
    availableGroups: availableGroups.map(g => ({
      name: g.name,
      positions: g.positions.map(p => ({
        name: p.name,
        maxSlots: p.maxSlots,
        currentMembers: p.members?.length || 0
      }))
    }))
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Sign Up Details</h3>
        <div className="mt-2">
          <p><span className="font-medium">Title:</span> {sheet.title}</p>
          <p><span className="font-medium">Closing Date:</span> {formatDateTimeForDisplay(sheet.signUpBy)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Group</label>
          <select
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedGroup}
            onChange={(e) => {
              const newGroup = e.target.value;
              console.log('Group selection changed:', {
                previousGroup: selectedGroup,
                newGroup,
                availablePositions: sheet.groups?.find(g => g.name === newGroup)?.positions
                  .filter(p => p.maxSlots === -1 || p.maxSlots === 0 || (p.members?.length || 0) < p.maxSlots)
              });
              setSelectedGroup(newGroup);
              setSelectedPosition('');
            }}
          >
            <option value="">Select a group</option>
            {availableGroups.map((group, index) => (
              <option key={index} value={group.name}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {selectedGroup && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedPosition}
              onChange={(e) => {
                const newPosition = e.target.value;
                console.log('Position selection changed:', {
                  previousPosition: selectedPosition,
                  newPosition
                });
                setSelectedPosition(newPosition);
              }}
            >
              <option value="">Select a position</option>
              {availablePositions.map((position, index) => {
                const currentMembers = position.members?.length || 0;
                const slotsText = position.maxSlots <= 0 
                  ? `(${currentMembers} signed up - Unlimited slots)`
                  : `(${currentMembers}/${position.maxSlots} slots filled)`;
                
                return (
                  <option key={index} value={position.name}>
                    {position.name} {slotsText}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Note (Optional)</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="remindMe"
            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            checked={remindMe}
            onChange={(e) => setRemindMe(e.target.checked)}
          />
          <label htmlFor="remindMe" className="ml-2 text-sm text-gray-700">
            Remind Me
          </label>
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedGroup || !selectedPosition}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Sign Up'}
          </button>
        </div>
      </form>
    </div>
  );
} 