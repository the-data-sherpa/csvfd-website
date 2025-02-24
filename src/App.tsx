import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Phone, Clock, AlertTriangle, Users, Facebook, LogOut, ChevronDown, Settings } from 'lucide-react';
import { CallStatistics } from './components/CallStatistics';
import { FacebookFeed } from './components/FacebookFeed';
import { SectionPage } from './pages/SectionPage';
import { MembersArea } from './pages/MembersArea';
import CMSDashboard from './pages/CMSDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { PageEditor } from './pages/PageEditor';
import { Auth } from './components/Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { useState, useEffect } from 'react';
import { Page } from './types/database';
import { WeatherInfo } from './components/WeatherInfo';
import { AnnouncementEditor } from './pages/AnnouncementEditor';
import { AnnouncementsDisplay } from './components/AnnouncementsDisplay';
import { ApplicationForm } from './pages/ApplicationForm';

function Navigation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState<Record<string, Page[]>>({});
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  useEffect(() => {
    async function fetchPages() {
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('published', true)
          .order('order', { ascending: true });

        if (error) throw error;

        // Group pages by section
        const groupedPages = (data || []).reduce((acc, page) => {
          if (!acc[page.section]) {
            acc[page.section] = [];
          }
          acc[page.section].push(page);
          return acc;
        }, {} as Record<string, Page[]>);

        setPages(groupedPages);
      } catch (err) {
        console.error('Error fetching pages:', err);
      }
    }

    fetchPages();


    // Set up real-time subscription for page changes
    const subscription = supabase
      .channel('nav_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pages',
        filter: 'published=eq.true'
      }, (payload) => {
        // Handle different types of changes
        switch (payload.eventType) {
          case 'INSERT':
          case 'DELETE':
          case 'UPDATE':
            fetchPages(); // Refetch all pages to ensure correct order
            break;
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array since fetchPages is defined inside

  const handleMouseEnter = (section: string) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setDropdownOpen(section);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setDropdownOpen(null);
    }, 150); // Small delay to allow clicking menu items
    setCloseTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <img 
                src="https://csvfd-website.nyc3.digitaloceanspaces.com/photos/1740198321138-blob"
                alt="Fire Department Logo" 
                className="h-20 w-20 object-contain"
              />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Cool Springs Volunteer Fire Department</h1>
              <p className="text-sm text-gray-600">Protecting Our Community Since 1960</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-red-600 transition">Home</Link>
            {['our-department', 'services', 'memorials', 'cool-spring'].map((section) => (
              <div
                key={section}
                className="relative"
                onMouseEnter={() => handleMouseEnter(section)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`text-gray-700 hover:text-red-600 transition ${
                    location.pathname.startsWith(`/${section}`) ? 'text-red-600' : ''
                  }`}
                >
                  {section.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  {pages[section] && pages[section].length > 0 && (
                    <ChevronDown className="w-4 h-4 inline-block ml-1" />
                  )}
                </button>
                {pages[section] && pages[section].length > 0 && dropdownOpen === section && (
                  <div 
                    className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                    onMouseEnter={() => handleMouseEnter(section)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="py-1" role="menu">
                      {pages[section].map((page) => (
                        <Link
                          key={page.id}
                          to={`/${section}/${page.slug}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600"
                          role="menuitem"
                        >
                          {page.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition"
                >
                  <span>Hi, {user.email?.split('@')[0]}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {userMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="py-1">
                      <Link
                        to="/members"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600"
                      >
                        <Users className="w-4 h-4 inline-block mr-2" />
                        Members Area
                      </Link>
                      <Link
                        to="/members/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600"
                      >
                        <Settings className="w-4 h-4 inline-block mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600"
                      >
                        <LogOut className="w-4 h-4 inline-block mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/members/login" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
                Members Area
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, role } = useAuth();
  const requiresAdmin = window.location.pathname.startsWith('/members/admin');
  const requiresWebmaster = window.location.pathname.startsWith('/members/cms');

  // Skip auth check in development or WebContainer
  if (import.meta.env.DEV || window.location.hostname.includes('local-credentialless')) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/members/login" />;
  }

  if (requiresAdmin && role !== 'admin') {
    return <Navigate to="/members" />;
  }

  if (requiresWebmaster && !['webmaster', 'admin'].includes(role || '')) {
    return <Navigate to="/members" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white">
          {/* Emergency Banner */}
          <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <p className="text-sm font-medium">Emergency? Dial 911 Immediately</p>
          </div>

          {/* Navigation */}
          <Navigation />

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:section/:slug" element={<SectionPage />} />
            <Route path="/members/login" element={<Auth />} />
            <Route
              path="/members"
              element={
                <PrivateRoute>
                  <MembersArea />
                </PrivateRoute>
              }
            />
            <Route
              path="/members/cms"
              element={
                <PrivateRoute>
                  <CMSDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/members/cms/new"
              element={
                <PrivateRoute>
                  <PageEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/members/cms/edit/:id"
              element={
                <PrivateRoute>
                  <PageEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/members/cms/announcements/new"
              element={
                <PrivateRoute>
                  <AnnouncementEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/members/cms/announcements/edit/:id"
              element={
                <PrivateRoute>
                  <AnnouncementEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/members/admin"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route path="/apply" element={<ApplicationForm />} />
          </Routes>

          {/* Footer */}
          <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <h4 className="text-xl font-semibold mb-4">Contact Us</h4>
                  <p className="mb-2">672 Mocksville Highway</p>
                  <p className="mb-2">Statesville, NC 28625</p>
                  <p className="mb-2">(704) 872-3221</p>
                  <p>info@coolspringsvfd.org</p>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-4">Resources</h4>
                  <ul className="space-y-2">
                    <li><a href="https://apps.ncagr.gov/burnpermits/" target="_blank" className="hover:text-red-400 transition">Online Burn Permit</a></li>
                    <li><a href="https://www.sparky.org/" target="_blank" className="hover:text-red-400 transition">Sparky The Dog</a></li>
                    <li><a href="https://www.readync.gov/" target="_blank" className="hover:text-red-400 transition">ReadyNC</a></li>
                    <li><a href="https://www.iredellcountync.gov/219/Fire-Marshals-Office" target="_blank" className="hover:text-red-400 transition">Fire Marshals Office</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-4">Follow Us</h4>
                  <div className="flex space-x-4">
                    <a href="https://www.facebook.com/coolspringsvfd" className="hover:text-red-400 transition">
                      <Facebook className="w-6 h-6" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-8 text-center">
                <p>&copy; 2025 The Data Sherpa All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero Section */}
      <div className="relative h-[600px]">
        <div className="absolute inset-0">
          <img 
            src="https://csvfd-website.nyc3.digitaloceanspaces.com/photos/1740064374334-station-banner.jpg" 
            alt="Fire Station at Dusk" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="text-white max-w-2xl">
            <h2 className="text-5xl font-bold mb-6">Serving our community</h2>
            <p className="text-xl mb-8">Fire Protection • Medical First Response • Community Service</p>
            <div className="flex space-x-4">
              <button onClick={() => navigate('/apply')} className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition">
                Join Our Team
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div className="flex items-start space-x-4">

            <Phone className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Emergency Contact</h3>
              <p className="text-gray-600">Dial 911 for Emergencies</p>
              <p className="text-gray-600">Non-Emergency: (704) 872-3221</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Clock className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Station Hours</h3>
              <div className="text-gray-600">
                <p className="font-bold mb-1">24/7 Emergency Response</p>
                <p className="font-medium mb-1">Manned Hours:</p>
                <ul className="list-inside pl-2">
                  <li>Mon-Fri 8AM-5PM</li>
                  <li>Sat 2PM-10PM</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Users className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Volunteer</h3>
              <p className="text-gray-600">Join our team of dedicated</p>
              <p className="text-gray-600">firefighters and first responders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call Statistics Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Department Activity</h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <CallStatistics />
          </div>
        </div>
      </div>

      {/* Latest Updates Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Latest Updates</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg overflow-hidden shadow-md">
              <div className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-4">Weather Information</h3>
                <WeatherInfo />
              </div>
            </div>
            <div className="bg-white rounded-lg overflow-hidden shadow-md">
              <div className="p-6 pb-0 text-center">
                <h3 className="text-xl font-semibold mb-4">Social Media</h3>
              </div>
              <div className="aspect-[4/5]">
                <FacebookFeed />
              </div>
            </div>
            <div className="bg-white rounded-lg overflow-hidden shadow-md">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">Community Announcements</h3>
                <AnnouncementsDisplay />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;