import React, { useEffect, useState } from 'react';
import { supabase, getSupabaseClient } from '../lib/supabase';
import { MonthlyCallStat, YearlyCallStat } from '../types/database';
import { BarChart2, Calendar, Save } from 'lucide-react';

const currentYear = new Date().getFullYear();

export function CallStatisticsEditor() {
  const [activeTab, setActiveTab] = useState<'current' | 'yearly'>('current');
  const [monthlyStats, setMonthlyStats] = useState<MonthlyCallStat[]>([]);
  const [editedMonthlyStats, setEditedMonthlyStats] = useState<MonthlyCallStat[]>([]);
  const [yearlyStats, setYearlyStats] = useState<YearlyCallStat[]>([]);
  const [editedYearlyStats, setEditedYearlyStats] = useState<YearlyCallStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStats();

    const monthlySubscription = supabase.channel('monthly_stats_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_call_stats' }, fetchStats)
      .subscribe();

    const yearlySubscription = supabase.channel('yearly_stats_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'yearly_call_stats' }, fetchStats)
      .subscribe();

    return () => {
      monthlySubscription.unsubscribe();
      yearlySubscription.unsubscribe();
    };
  }, []);

  async function fetchStats() {
    try {
      // Fetch monthly stats
      const { data: monthlyData, error: monthlyError } = await getSupabaseClient(true)
        .from('monthly_call_stats')
        .select('*')
        .eq('year', currentYear)
        .order('month');

      if (monthlyError) throw monthlyError;
      setMonthlyStats(monthlyData || []);
      setEditedMonthlyStats(monthlyData || []);

      // Fetch yearly stats
      const { data: yearlyData, error: yearlyError } = await getSupabaseClient(true)
        .from('yearly_call_stats')
        .select('*')
        .gte('year', currentYear - 9)
        .order('year', { ascending: false });

      if (yearlyError) throw yearlyError;
      setYearlyStats(yearlyData || []);
      setEditedYearlyStats(yearlyData || []);
    } catch (err) {
      console.error('Error fetching call statistics:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMonthlyStatChange(month: number, values: { fires: number; medical: number }) {
    const updatedStats = editedMonthlyStats.map(stat => {
      if (stat.month === month) {
        return { ...stat, ...values };
      }
      return stat;
    });

    // If stat doesn't exist, add it
    if (!updatedStats.find(s => s.month === month)) {
      updatedStats.push({
        id: `temp-${month}`,
        year: currentYear,
        month,
        ...values,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    setEditedMonthlyStats(updatedStats);
  }

  async function handleYearlyStatChange(year: number, total_calls: number) {
    const updatedStats = editedYearlyStats.map(stat => {
      if (stat.year === year) {
        return { ...stat, total_calls };
      }
      return stat;
    });

    setEditedYearlyStats(updatedStats);
  }

  async function saveMonthlyStats() {
    setSaving(true);
    try {
      // Prepare upsert data
      const upsertData = editedMonthlyStats.map(({ id, created_at, updated_at, ...rest }) => ({
        ...rest
      }));

      const { error } = await getSupabaseClient(true)
        .from('monthly_call_stats')
        .upsert(upsertData, {
          onConflict: 'year,month'
        });

      if (error) throw error;
      await fetchStats();
    } catch (err) {
      console.error('Error saving monthly statistics:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function saveYearlyStats() {
    setSaving(true);
    try {
      const upsertData = editedYearlyStats.map(({ id, created_at, updated_at, ...rest }) => ({
        ...rest
      }));

      const { error } = await getSupabaseClient(true)
        .from('yearly_call_stats')
        .upsert(upsertData, {
          onConflict: 'year'
        });

      if (error) throw error;
      await fetchStats();
    } catch (err) {
      console.error('Error saving yearly statistics:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function hasMonthlyChanges() {
    return JSON.stringify(monthlyStats) !== JSON.stringify(editedMonthlyStats);
  }

  function hasYearlyChanges() {
    return JSON.stringify(yearlyStats) !== JSON.stringify(editedYearlyStats);
  }

  function discardChanges() {
    if (activeTab === 'current') {
      setEditedMonthlyStats(monthlyStats);
    } else {
      setEditedYearlyStats(yearlyStats);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs and Actions */}
      <div className="border-b border-gray-200">
        <div className="flex justify-between items-center">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('current')}
              className={`${
                activeTab === 'current'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Current Year
            </button>
            <button
              onClick={() => setActiveTab('yearly')}
              className={`${
                activeTab === 'yearly'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <BarChart2 className="w-5 h-5 mr-2" />
              Year over Year
            </button>
          </nav>
          <div className="flex items-center space-x-4">
            <button
              onClick={discardChanges}
              disabled={saving || (activeTab === 'current' ? !hasMonthlyChanges() : !hasYearlyChanges())}
              className={`flex items-center px-4 py-2 rounded-lg transition ${
                saving || (activeTab === 'current' ? !hasMonthlyChanges() : !hasYearlyChanges())
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              Discard Changes
            </button>
            <button
              onClick={() => activeTab === 'current' ? saveMonthlyStats() : saveYearlyStats()}
              disabled={saving || (activeTab === 'current' ? !hasMonthlyChanges() : !hasYearlyChanges())}
              className={`flex items-center px-4 py-2 rounded-lg transition ${
                saving || (activeTab === 'current' ? !hasMonthlyChanges() : !hasYearlyChanges())
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'current' ? (
          <div className="space-y-6">
            <div className="mb-4 text-sm text-gray-600">
              <p>Enter the number of calls for each category. The total will be calculated automatically.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                const stat = editedMonthlyStats.find(s => s.month === month) || {
                  fires: 0,
                  medical: 0
                };
                return (
                  <div key={month} className="space-y-2">
                    <div className="text-base font-medium text-gray-900">
                      {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fire</label>
                        <input
                          type="number"
                          min="0"
                          value={stat.fires}
                          onChange={(e) => {
                            const fires = parseInt(e.target.value) || 0;
                            handleMonthlyStatChange(month, {
                              fires,
                              medical: stat.medical
                            });
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Medical</label>
                        <input
                          type="number"
                          min="0"
                          value={stat.medical}
                          onChange={(e) => {
                            const medical = parseInt(e.target.value) || 0;
                            handleMonthlyStatChange(month, {
                              fires: stat.fires,
                              medical
                            });
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Total: {stat.fires + stat.medical}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Year</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Total Calls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white text-center">
                  {editedYearlyStats.map(stat => (
                    <tr key={stat.year}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        <input
                          type="number"
                          min="1960"
                          max={currentYear}
                          value={stat.year}
                          onChange={(e) => {
                            const newYear = parseInt(e.target.value) || currentYear;
                            const updatedStats = editedYearlyStats.map(s => 
                              s.id === stat.id ? { ...s, year: newYear } : s
                            );
                            setEditedYearlyStats(updatedStats);
                          }}
                          className="w-24 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-center"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                        <input
                          type="number"
                          min="0"
                          value={stat.total_calls}
                          onChange={(e) => handleYearlyStatChange(stat.year, parseInt(e.target.value) || 0)}
                          className="w-32 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-center"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              * Enter the total number of calls for each year. Changes will be saved when you click "Save Changes".
            </div>
          </div>
        )}
      </div>
    </div>
  );
}