import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Page, PageSection } from '../types/database';
import { PageContent } from '../components/PageContent';

export function SectionPage() {
  const { section, slug } = useParams<{ section: PageSection; slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPage() {
      try {
        if (!section || !slug) {
          setError('Invalid page URL');
          return;
        }

        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('section', section)
          .eq('slug', slug)
          .eq('published', section === 'members' ? false : true)
          .single();

        if (error) throw error;
        setPage(data);
      } catch (err) {
        setError('Failed to load page');
        console.error('Error loading page:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
  }, [section, slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-gray-600">The page you're looking for doesn't exist or has been moved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageContent page={page} />
    </div>
  );
}