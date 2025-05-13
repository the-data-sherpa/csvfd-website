import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar } from 'lucide-react';
import DOMPurify from 'dompurify';
import { formatDateForDisplay } from '../utils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  published: boolean;
  created_by: string;
  user_email: string;
}

export function AnnouncementsDisplay() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();

    const subscription = supabase
      .channel('announcements_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'announcements',
        filter: 'published=eq.true'
      }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchAnnouncements() {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(5);  // Limit to 5 most recent announcements

      if (error) throw error;
      const announcements = data?.map(a => ({
        ...a,
        user_email: a.created_by || 'Member'
      })) || [];
      setAnnouncements(announcements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">No announcements at this time</p>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div key={announcement.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDateForDisplay(announcement.created_at)} by {announcement.user_email.split('@')[0]}
          </div>
          <h3 className="text-xl font-semibold mb-2">{announcement.title}</h3>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(announcement.content) 
            }}
          />
        </div>
      ))}
    </div>
  );
} 