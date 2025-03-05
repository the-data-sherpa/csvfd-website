import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Page, PageSection } from '../types/database';
import { FileText, Edit2, Trash2, Plus, ChevronRight, BarChart, Megaphone } from 'lucide-react';
import { CallStatisticsEditor } from '../components/CallStatisticsEditor';
import { AnnouncementsEditor } from '../components/AnnouncementsEditor';

const SECTION_TITLES: Record<PageSection, string> = {
  'our-department': 'Our Department',
  'services': 'Services',
  'memorials': 'Memorials',
  'cool-spring': 'Cool Spring',
  'members': 'Members'
};

interface PageStats {
  total: number;
  published: number;
  draft: number;
  lastUpdated: string | null;
}

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
  const [stats, setStats] = useState<PageStats>({
    total: 0,
    published: 0,
    draft: 0,
    lastUpdated: null
  });

  async function handlePublishToggle(page: Page) {
    try {
      console.log('Toggling publish status for:', page.title);
      console.log('Current status:', page.published);
      
      const newStatus = !page.published;
      console.log('New status will be:', newStatus);
      
      const { data, error } = await supabase
        .from('pages')
        .update({ published: newStatus })
        .eq('id', page.id)
        .select('*');

      if (error) throw error;
      
      console.log('Update successful:', data);
      
      // Force an immediate state update
      setPages(prevPages => {
        const newPages = { ...prevPages };
        const section = page.section as PageSection; // Type assertion to fix index error
        newPages[section] = newPages[section].map((p: Page) => 
          p.id === page.id ? { ...p, published: newStatus } : p
        );
        return newPages;
      });
      
    } catch (err) {
      console.error('Error toggling publish status:', err);
    }
  }

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

      // Calculate stats
      if (data) {
        const published = data.filter(page => page.published).length;
        setStats({
          total: data.length,
          published,
          draft: data.length - published,
          lastUpdated: data[0]?.updated_at || null
        });
      }
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
      }, () => {
        console.log('Received database change');
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
          <h2 className="text-xl font-semibold">Content Management</h2>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-24"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-sm text-gray-500 uppercase">Total Pages</h4>
                <p className="text-2xl font-semibold mt-2">{stats.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-sm text-gray-500 uppercase">Published</h4>
                <p className="text-2xl font-semibold mt-2">{stats.published}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-sm text-gray-500 uppercase">Draft</h4>
                <p className="text-2xl font-semibold mt-2">{stats.draft}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="text-sm text-gray-500 uppercase">Last Updated</h4>
                <p className="text-2xl font-semibold mt-2">
                  {stats.lastUpdated
                    ? new Date(stats.lastUpdated).toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Never'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Announcements Editor */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <Megaphone className="w-5 h-5 text-red-600 mr-2" />
              <h2 className="text-xl font-semibold">Community Announcements</h2>
            </div>
            <button
              onClick={() => navigate('/members/cms/announcements/new')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Announcement
            </button>
          </div>
          <div className="p-6">
            <AnnouncementsEditor />
          </div>
        </div>

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

        {/* Pages Section */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-red-600 mr-2" />
              <h2 className="text-xl font-semibold">Website Pages</h2>
            </div>
            <button
              onClick={() => navigate('/members/cms/new')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Page
            </button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(pages).map(([section, sectionPages]) => (
                  <div key={section} className="border rounded-lg">
                    <div className="px-6 py-3 bg-gray-50 border-b rounded-t-lg">
                      <h3 className="font-semibold text-gray-800">
                        {SECTION_TITLES[section as PageSection]}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
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
                                  <span className="text-gray-900">{page.title}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={page.published}
                                        onChange={() => handlePublishToggle(page)}
                                        className="sr-only"
                                      />
                                      <div className={`w-[120px] h-6 rounded-full relative transition-colors duration-300 
                                        ${page.published ? 'bg-green-100' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-[56px] 
                                          transition-transform duration-300 transform
                                          ${page.published ? 'translate-x-[60px]' : 'translate-x-0'}`}>
                                        </div>
                                        <span className={`absolute left-2 text-xs font-medium text-gray-800 transition-opacity duration-300
                                          ${page.published ? 'opacity-100' : 'opacity-0'}`}>
                                          Published
                                        </span>
                                        <span className={`absolute right-2 text-xs font-medium text-gray-800 transition-opacity duration-300
                                          ${page.published ? 'opacity-0' : 'opacity-100'}`}>
                                          Draft
                                        </span>
                                      </div>
                                    </label>
                                  </div>
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
      </div>
    </div>
  );
}

export default CMSDashboard;