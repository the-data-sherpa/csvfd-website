import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Page, PageSection } from '../types/database';
import { Save, ArrowLeft, Globe, Eye, Edit2 } from 'lucide-react';
import { RichTextEditor } from '../components/RichTextEditor';
import { PagePreview } from '../components/PagePreview';

export function PageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPreview, setIsPreview] = useState(false);
  const [page, setPage] = useState<Partial<Page>>({
    title: '',
    content: '',
    section: 'our-department',
    published: false,
    meta_description: '',
    meta_keywords: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const isNew = !id;

  useEffect(() => {
    if (!isNew) {
      fetchPage();
    } else {
      setLoading(false);
    }
  }, [id]);

  async function fetchPage() {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPage(data);
    } catch (err) {
      console.error('Error fetching page:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublishToggle() {
    setUpdateLoading(true);
    try {
      const newPublishedState = !page.published;
      const { error } = await supabase
        .from('pages')
        .update({ 
          published: newPublishedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      setPage({ ...page, published: newPublishedState });
    } catch (err) {
      console.error('Error updating published state:', err);
    } finally {
      setUpdateLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (!page.title) {
        throw new Error('Title is required');
      }

      const slug = page.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const pageData = {
        title: page.title,
        content: page.content || '',
        section: page.section,
        published: page.published,
        meta_description: page.meta_description,
        meta_keywords: page.meta_keywords,
        slug,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (isNew) {
        const { error: err } = await supabase
          .from('pages')
          .insert([{ ...pageData, order: 0 }]);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('pages')
          .update(pageData)
          .match({ id });
        error = err;
      }

      if (error) {
        console.error('Error saving page:', error);
        throw error;
      }

      navigate('/members/cms');
    } catch (err) {
      console.error('Error saving page:', err);
      alert('Failed to save page. Please try again.');
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
                {isNew ? 'Create New Page' : 'Edit Page'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                {isPreview ? (
                  <>
                    <Edit2 className="w-5 h-5 mr-2" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 mr-2" />
                    Preview
                  </>
                )}
              </button>
              <button
                onClick={handlePublishToggle}
                disabled={isNew || updateLoading}
                className={`flex items-center px-4 py-2 rounded-lg transition ${
                  page.published
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                } ${(isNew || updateLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {updateLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : page.published ? (
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
        {isPreview ? (
          <PagePreview page={page} />
        ) : (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={page.title}
                  onChange={(e) => setPage({ ...page, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div>
                <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                  Section
                </label>
                <select
                  id="section"
                  value={page.section}
                  onChange={(e) => setPage({ ...page, section: e.target.value as PageSection })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                >
                  <option value="our-department">Our Department</option>
                  <option value="services">Services</option>
                  <option value="memorials">Memorials</option>
                  <option value="cool-spring">Cool Spring</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Content</h3>
            <RichTextEditor
              content={page.content || ''}
              onChange={(content) => setPage({ ...page, content })}
            />
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700">
                  Meta Description
                </label>
                <textarea
                  id="meta_description"
                  value={page.meta_description || ''}
                  onChange={(e) => setPage({ ...page, meta_description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div>
                <label htmlFor="meta_keywords" className="block text-sm font-medium text-gray-700">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  id="meta_keywords"
                  value={page.meta_keywords || ''}
                  onChange={(e) => setPage({ ...page, meta_keywords: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}