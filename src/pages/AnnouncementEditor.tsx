import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabase-admin';
import { Save, ArrowLeft, Globe, Eye } from 'lucide-react';
import { RichTextEditor } from '../components/RichTextEditor';
import { useAuth } from '../contexts/AuthContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  profiles?: {
    email: string;
  };
}

export function AnnouncementEditor() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    published: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isNew = !id;

  useEffect(() => {
    if (!isNew) {
      fetchAnnouncement();
    } else {
      setLoading(false);
    }
  }, [id]);

  async function fetchAnnouncement() {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles:created_by (email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAnnouncement(data);
    } catch (err) {
      console.error('Error fetching announcement:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (!announcement.title) {
        throw new Error('Title is required');
      }

      const announcementData = {
        title: announcement.title,
        content: announcement.content || '',
        published: announcement.published,
        updated_at: new Date().toISOString(),
        created_by: user?.id
      };

      let error;
      if (isNew) {
        const { error: err } = await supabaseAdmin
          .from('announcements')
          .insert([announcementData]);
        error = err;
      } else {
        const { error: err } = await supabaseAdmin
          .from('announcements')
          .update(announcementData)
          .match({ id });
        error = err;
      }

      if (error) throw error;
      navigate('/members/cms');
    } catch (err) {
      console.error('Error saving announcement:', err);
      alert('Failed to save announcement. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/members/cms')}
                className="text-white hover:text-gray-200 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold">
                {isNew ? 'Create New Announcement' : 'Edit Announcement'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAnnouncement({ ...announcement, published: !announcement.published })}
                className={`flex items-center px-4 py-2 rounded-lg transition ${
                  announcement.published
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {announcement.published ? (
                  <>
                    <Globe className="w-5 h-5 mr-2" />
                    Published
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 mr-2" />
                    Draft
                  </>
                )}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              {!isNew && announcement.profiles?.email && (
                <div className="text-sm text-gray-500">
                  Created by {announcement.profiles.email.split('@')[0]}
                </div>
              )}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <RichTextEditor
                  content={announcement.content || ''}
                  onChange={(content) => setAnnouncement({ ...announcement, content })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 