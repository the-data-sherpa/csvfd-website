import React, { useEffect, useState } from 'react';
import { supabase, getSupabaseClient } from '../lib/supabase';
import { MonthlyCallStat, YearlyCallStat } from '../types/database';
import { BarChart2, Calendar, Save, Plus, X } from 'lucide-react';
import { formatDateForDisplay } from '../utils';

const currentYear = new Date().getFullYear();

export function CallStatisticsEditor() {
  const [activeTab, setActiveTab] = useState<'current' | 'yearly'>('current');
  const [monthlyStats, setMonthlyStats] = useState<MonthlyCallStat[]>([]);
  const [yearlyStats, setYearlyStats] = useState<YearlyCallStat[]>([]);
  const [editedMonthlyStats, setEditedMonthlyStats] = useState<MonthlyCallStat[]>([]);
  const [editedYearlyStats, setEditedYearlyStats] = useState<YearlyCallStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      setLoading(true);

      // Fetch monthly stats for current year
      const { data: monthlyData, error: monthlyError } = await getSupabaseClient(true)
        .from('monthly_call_stats')
        .select('*')
        .eq('year', currentYear)
        .order('month');

      if (monthlyError) throw monthlyError;
      
      // Create monthly stats for each month if they don't exist
      const allMonths: MonthlyCallStat[] = [];
      for (let month = 1; month <= 12; month++) {
        const existingStat = monthlyData?.find(s => s.month === month);
        if (existingStat) {
          allMonths.push(existingStat);
        } else {
          allMonths.push({
            id: `temp-${month}`,
            year: currentYear,
            month,
            fires: 0,
            medical: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }

      setMonthlyStats(allMonths);
      setEditedMonthlyStats(allMonths);

      // Fetch yearly stats
      const { data: yearlyData, error: yearlyError } = await getSupabaseClient(true)
        .from('yearly_call_stats')
        .select('*')
        .order('year', { ascending: false });

      if (yearlyError) throw yearlyError;
      
      // Add current year if it doesn't exist
      let yearlyWithCurrent = yearlyData || [];
      if (!yearlyWithCurrent.some(s => s.year === currentYear - 1)) {
        const newYear: YearlyCallStat = {
          id: `temp-${currentYear - 1}`,
          year: currentYear - 1,
          total_calls: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        yearlyWithCurrent = [newYear, ...yearlyWithCurrent];
      }

      setYearlyStats(yearlyWithCurrent);
      setEditedYearlyStats(yearlyWithCurrent);
    } catch (err) {
      console.error('Error fetching call statistics:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }

  const handleMonthlyStatChange = (month: number, values: { fires: number, medical: number }) => {
    setEditedMonthlyStats(prev => 
      prev.map(stat => 
        stat.month === month 
          ? { ...stat, fires: values.fires, medical: values.medical } 
          : stat
      )
    );
  };

  const handleYearlyStatChange = (year: number, totalCalls: number) => {
    setEditedYearlyStats(prev => 
      prev.map(stat => 
        stat.year === year 
          ? { ...stat, total_calls: totalCalls } 
          : stat
      )
    );
  };

  const addYearStat = () => {
    const years = editedYearlyStats.map(s => s.year);
    let minYear = Math.min(...years);
    minYear = minYear > 1960 ? minYear - 1 : minYear;
    
    const newStat: YearlyCallStat = {
      id: `new-${Date.now()}`,
      year: minYear,
      total_calls: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setEditedYearlyStats([...editedYearlyStats, newStat]);
  };

  const removeYearStat = (id: string) => {
    setEditedYearlyStats(prev => prev.filter(s => s.id !== id));
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Save monthly stats
      const monthlyPromises = editedMonthlyStats.map(async stat => {
        if (stat.id.startsWith('temp-')) {
          // Create new stat
          return getSupabaseClient(true)
            .from('monthly_call_stats')
            .insert({
              year: stat.year,
              month: stat.month,
              fires: stat.fires,
              medical: stat.medical
            });
        } else {
          // Update existing stat
          return getSupabaseClient(true)
            .from('monthly_call_stats')
            .update({
              fires: stat.fires,
              medical: stat.medical
            })
            .eq('id', stat.id);
        }
      });

      // Save yearly stats
      const yearlyPromises = editedYearlyStats.map(async stat => {
        if (stat.id.startsWith('temp-') || stat.id.startsWith('new-')) {
          // Create new stat
          return getSupabaseClient(true)
            .from('yearly_call_stats')
            .insert({
              year: stat.year,
              total_calls: stat.total_calls
            });
        } else {
          // Update existing stat
          return getSupabaseClient(true)
            .from('yearly_call_stats')
            .update({
              year: stat.year,
              total_calls: stat.total_calls
            })
            .eq('id', stat.id);
        }
      });

      // Wait for all requests to complete
      await Promise.all([...monthlyPromises, ...yearlyPromises]);
      
      // Refresh data
      await fetchStats();
      setSuccess('Changes saved successfully');
    } catch (err) {
      console.error('Error saving statistics:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'current'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Current Year
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'yearly'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Historical Data
          </button>
        </div>
        
        <div className="flex space-x-2">
          {activeTab === 'yearly' && (
            <button
              onClick={addYearStat}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center hover:bg-gray-200 transition"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Year
            </button>
          )}
          <button
            onClick={saveChanges}
            disabled={saving}
            className="px-3 py-2 bg-green-600 text-white rounded-lg flex items-center hover:bg-green-700 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
          {success}
        </div>
      )}

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
                      {formatDateForDisplay(new Date(2024, month - 1, 1))}
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
                    <tr key={stat.id}>
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