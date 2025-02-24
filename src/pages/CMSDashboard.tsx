import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Page, PageSection } from '../types/database';
import { FileText, Edit2, Trash2, Plus, ChevronRight, BarChart } from 'lucide-react';
import { CallStatisticsEditor } from '../components/CallStatisticsEditor';

const SECTION_TITLES: Record<PageSection, string> = {
  'our-department': 'Our Department',
  'services': 'Services',
  'memorials': 'Memorials',
  'cool-spring': 'Cool Spring',
  'members': 'Members'
};

export function CMSDashboard() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<Record<PageSection, Page[]>>({
    'our-department': [],
    'services': [],
    'memorials': [],
    'cool-spring': [],
    'members': []
  });
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  async function fetchPages() {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('section', { ascending: true })
        .order('order', { ascending: true });

      if (error) throw error;
      
      // Group pages by section
      const groupedPages = (data || []).reduce((acc, page) => {
        const section = page.section as PageSection;
        if (!acc[section]) {
          acc[section] = [];
        }
        acc[section].push(page);
        return acc;
      }, {} as Record<PageSection, Page[]>);
      setPages(groupedPages);
    } catch (err) {
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPages();

    // Set up real-time subscription
    const subscription = supabase
      .channel('cms_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pages'
      }, (payload) => {
        fetchPages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(pageId);
    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;
      await fetchPages();
    } catch (err) {
      console.error('Error deleting page:', err);
    }
    setDeleteLoading(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm mb-2">
            <Link to="/members" className="hover:text-red-400 transition">Members Area</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-red-400">Content Management</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Content Management</h2>
            <button
              onClick={() => navigate('/members/cms/new')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Page
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Call Statistics Editor */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <BarChart className="w-5 h-5 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold">Call Statistics</h2>
          </div>
          <div className="p-6">
            <CallStatisticsEditor />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(pages).map(([section, sectionPages]) => (
              <div key={section} className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {SECTION_TITLES[section as PageSection]}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sectionPages.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                            No pages in this section
                          </td>
                        </tr>
                      ) : (
                        sectionPages.map((page) => (
                          <tr key={page.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <FileText className="w-5 h-5 text-gray-400 mr-3" />
                                <span className="text-gray-900">{page.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {page.published ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Published
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Draft
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {new Date(page.updated_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => navigate(`/members/cms/edit/${page.id}`)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(page.id)}
                                disabled={deleteLoading === page.id}
                                className={`text-red-600 hover:text-red-900 ${
                                  deleteLoading === page.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <Trash2 className={`w-5 h-5 ${deleteLoading === page.id ? 'animate-spin' : ''}`} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CMSDashboard;