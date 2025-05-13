import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar } from 'lucide-react';
import DOMPurify from 'dompurify';
import { formatDateForDisplay } from '../utils';
import { Loading, Skeleton } from './ui/Loading';

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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-gray-200 pb-6 last:border-0">
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
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