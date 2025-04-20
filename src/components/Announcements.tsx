import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Megaphone, Trash2, Clock, AlertCircle, Plus } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  expires_at: string;
  user_id: string;
  created_by: string;
}

export interface AnnouncementsRef {
  openCreateModal: () => void;
}

// Add a Modal component (simplified version)
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
        
        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{title}</h3>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Announcements = forwardRef<AnnouncementsRef>((props, ref) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', expires_at: '' });
  const [loading, setLoading] = useState(true);
  const [showExpired, setShowExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, role } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
      setIsCreateModalOpen(true);
    }
  }));

  useEffect(() => {
    fetchAnnouncements();
  }, [showExpired]);

  async function fetchAnnouncements() {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('member_announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!showExpired) {
        // Only fetch active announcements if showExpired is false
        query = query.gte('expires_at', new Date().toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }

  async function createAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newAnnouncement.title || !newAnnouncement.content || !newAnnouncement.expires_at) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.from('member_announcements').insert([
        {
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          expires_at: new Date(newAnnouncement.expires_at).toISOString(),
          user_id: user?.id,
          created_by: user?.email
        }
      ]).select();
      
      if (error) throw error;
      
      setAnnouncements([...(data || []), ...announcements]);
      setNewAnnouncement({ title: '', content: '', expires_at: '' });
      setIsCreateModalOpen(false);
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError('Failed to create announcement');
    } finally {
      setLoading(false);
    }
  }

  async function deleteAnnouncement(id: string, userId: string) {
    // Check if user can delete this announcement
    // Users can delete their own announcements
    // Admins and webmasters can delete any announcement
    if (user?.id !== userId && !['admin', 'webmaster'].includes(role || '')) {
      setError('You do not have permission to delete this announcement');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('member_announcements')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError('Failed to delete announcement');
    } finally {
      setLoading(false);
    }
  }

  function isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  // Calculate minimum date for expiration (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minExpiryDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Megaphone className="w-5 h-5 mr-2 text-blue-600" />
          Member Announcements
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowExpired(!showExpired)}
            className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 flex items-center"
          >
            <Clock className="w-4 h-4 mr-1" />
            {showExpired ? 'Hide Expired' : 'Show Expired'}
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-sm px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Announcement
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Create new announcement modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Announcement"
      >
        <form onSubmit={createAnnouncement} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
            <input
              type="date"
              min={minExpiryDate}
              value={newAnnouncement.expires_at}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, expires_at: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button 
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Announcements list */}
      <div className="space-y-4">
        {loading && announcements.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No announcements available</p>
        ) : (
          announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className={`p-4 border ${isExpired(announcement.expires_at) ? 'border-gray-200 bg-gray-50' : 'border-blue-100 bg-blue-50'} rounded-md`}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium">
                  {announcement.title}
                  {isExpired(announcement.expires_at) && (
                    <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                      Expired
                    </span>
                  )}
                </h3>
                {(user?.id === announcement.user_id || ['admin', 'webmaster'].includes(role || '')) && (
                  <button 
                    onClick={() => deleteAnnouncement(announcement.id, announcement.user_id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div 
                className="mt-2 text-gray-700"
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
              <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <span>Posted by: {announcement.created_by}</span>
                <span>Expires: {new Date(announcement.expires_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}); 