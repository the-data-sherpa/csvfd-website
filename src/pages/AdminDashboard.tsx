import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SiteUser } from '../types/database';
import { formatDateForDisplay } from '../utils';

export function AdminDashboard() {
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();

    // Set up real-time subscription
    const subscription = supabase
      .channel('admin_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'site_users'
      }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .rpc('get_users_with_emails');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: 'member' | 'webmaster' | 'admin') {
    setUpdating(userId);
    setUpdateError(null);
    try {
      const { error } = await supabase
        .from('site_users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        setUpdateError(`Failed to update role: ${error.message}`);
        throw error;
      }

      // Update local state to reflect the change
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      console.error('Error updating role:', err);
      setUpdateError('Failed to update role. Please try again.');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm mb-2">
            <Link to="/members" className="hover:text-red-400 transition">Members Area</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-red-400">Admin Dashboard</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Admin Dashboard</h2>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Role Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-red-600" />
            <h3 className="text-xl font-semibold">Role Management</h3>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {updateError && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                <p>{updateError}</p>
              </div>
            </div>
          )}
          
          <div className="text-gray-600 mb-4">
            <p className="mb-2">Manage user roles and access levels:</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-start">
                <span className="w-2 h-2 mt-2 rounded-full bg-gray-400 mr-2"></span>
                <div><span className="font-semibold">Member:</span> Basic access to members area</div>
              </div>
              <div className="flex items-start">
                <span className="w-2 h-2 mt-2 rounded-full bg-gray-400 mr-2"></span>
                <div><span className="font-semibold">Webmaster:</span> Can manage website content</div>
              </div>
              <div className="flex items-start">
                <span className="w-2 h-2 mt-2 rounded-full bg-gray-400 mr-2"></span>
                <div><span className="font-semibold">Admin:</span> Full access including role management</div>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold">Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                          user.role === 'webmaster' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateForDisplay(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'member' | 'webmaster' | 'admin')}
                          disabled={updating === user.id || user.role === 'admin'}
                          className={`rounded-md border-gray-300 text-sm focus:border-red-500 focus:ring-red-500 ${
                            (updating === user.id || user.role === 'admin') ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="member">Member</option>
                          <option value="webmaster">Webmaster</option>
                          <option value="admin">Admin</option>
                        </select>
                        {updating === user.id && (
                          <span className="ml-2 inline-block">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}