import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Layout, FileText, Bell, Mail, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BookingCalendar } from '../components/BookingCalendar';
import { SignUpSheetList } from '../components/SignUpSheet';
import { Announcements, AnnouncementsRef } from '../components/Announcements';

export function MembersArea() {
  const { role } = useAuth();
  const announcementsRef = useRef<AnnouncementsRef>(null);

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
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
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

        {/* Member Announcements Section */}
        <div className="mt-8">
          <Announcements ref={announcementsRef} />
        </div>

        {/* Sign-up Sheets Section */}
        <div id="signup-sheets" className="mt-8 bg-white rounded-lg shadow-md p-6">
          <SignUpSheetList />
        </div>

        {/* Calendar Section */}
        <div className="mt-8">
          <BookingCalendar />
        </div>
      </div>
    </div>
  );
}