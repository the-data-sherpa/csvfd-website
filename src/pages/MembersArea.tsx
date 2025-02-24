import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout, FileText, Users, Settings, Bell, Mail, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PageStats {
  total: number;
  published: number;
  draft: number;
  lastUpdated: string | null;
}

export function MembersArea() {
  const { role } = useAuth();
  const [stats, setStats] = useState<PageStats>({
    total: 0,
    published: 0,
    draft: 0,
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPageStats() {
      try {
        // Get all pages
        const { data: pages, error } = await supabase
          .from('pages')
          .select('published, updated_at')
          .order('updated_at', { ascending: false });

        if (error) throw error;

        if (pages) {
          const published = pages.filter(page => page.published).length;
          setStats({
            total: pages.length,
            published,
            draft: pages.length - published,
            lastUpdated: pages[0]?.updated_at || null
          });
        }
      } catch (err) {
        console.error('Error fetching page stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPageStats();

    // Set up real-time subscription
    const subscription = supabase
      .channel('page_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pages' 
      }, () => {
        fetchPageStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Members Area Navigation */}
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Members Area</h2>
            <div className="flex items-center space-x-4">
              <Bell className="w-5 h-5" />
              <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-sm">JD</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">


          {/* Documents Card */}
          <a 
            href="https://drive.google.com/drive/folders/0AFMSxShEVntDUk9PVA"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
                <p className="text-gray-600">Access important documents</p>
              </div>
            </div>
          </a>

          {/* Email Card */}
          <a 
            href="http://mail.google.com/a/coolspringsvfd.org"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Email</h3>
                <p className="text-gray-600">Access your department email</p>
              </div>
            </div>
          </a>

          {['webmaster', 'admin'].includes(role || '') && (
            <Link 
              to="/members/cms"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Layout className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Content Management</h3>
                  <p className="text-gray-600">Manage website pages and content</p>
                </div>
              </div>
            </Link>
          )}

          {role === 'admin' && (
            <Link 
              to="/members/admin"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Admin Dashboard</h3>
                  <p className="text-gray-600">Manage user roles</p>
                </div>
              </div>
            </Link>
          )}
        </div>
        {/* Quick Stats */}
        <div className="mt-8 grid md:grid-cols-4 gap-6">
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
      </div>
    </div>
  );
}