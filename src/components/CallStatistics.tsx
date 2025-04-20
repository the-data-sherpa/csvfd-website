import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, getSupabaseClient } from '../lib/supabase';
import { MonthlyCallStat, YearlyCallStat } from '../types/database';
import { Activity, Flame, Heart, ChevronRight, ChevronLeft } from 'lucide-react';
import { Loading, Skeleton } from './ui/Loading';

export function CallStatistics() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyCallStat[]>([]);
  const [yearlyStats, setYearlyStats] = useState<YearlyCallStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const currentYear = new Date().getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
      // Fetch monthly stats for current year
      const { data: monthlyData, error: monthlyError } = await getSupabaseClient(true)
        .from('monthly_call_stats')
        .select('*')
        .eq('year', currentYear)
        .order('month');

      if (monthlyError) throw monthlyError;
      setMonthlyStats(monthlyData || []);

      // Fetch yearly stats
      const { data: yearlyData, error: yearlyError } = await getSupabaseClient(true)
        .from('yearly_call_stats')
        .select('*')
        .order('year', { ascending: false });

      if (yearlyError) throw yearlyError;
      setYearlyStats(yearlyData || []);
    } catch (err) {
      console.error('Error fetching call statistics:', err);
    } finally {
      setLoading(false);
    }
  }

  const currentMonthStats = monthlyStats.find(s => s.month === selectedMonth + 1) || {
    fires: 0,
    medical: 0
  };

  const totalCalls = currentMonthStats.fires + currentMonthStats.medical;

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      if (direction === 'prev') {
        return prev === 0 ? 11 : prev - 1;
      } else {
        return prev === 11 ? 0 : prev + 1;
      }
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
        <div className="h-64 bg-gray-50 rounded-lg">
          <Loading type="spinner" className="h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setActiveChart('monthly')}
          className={`px-4 py-2 rounded-lg transition ${
            activeChart === 'monthly'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Current Year
        </button>
        <button
          onClick={() => setActiveChart('yearly')}
          className={`px-4 py-2 rounded-lg transition ${
            activeChart === 'yearly'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Historical Data
        </button>
      </div>
      
      <AnimatePresence mode="wait">
        {activeChart === 'monthly' ? (
          <motion.div
            key="monthly"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold text-gray-800">
                {monthNames[selectedMonth]} {currentYear}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8" />
                  <span className="text-sm opacity-75">Total Calls</span>
                </div>
                <motion.div
                  key={totalCalls}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-4xl font-bold"
                >
                  {totalCalls}
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <Flame className="w-8 h-8" />
                  <span className="text-sm opacity-75">Fire Calls</span>
                </div>
                <motion.div
                  key={currentMonthStats.fires}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-4xl font-bold"
                >
                  {currentMonthStats.fires}
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <Heart className="w-8 h-8" />
                  <span className="text-sm opacity-75">Medical Calls</span>
                </div>
                <motion.div
                  key={currentMonthStats.medical}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-4xl font-bold"
                >
                  {currentMonthStats.medical}
                </motion.div>
              </motion.div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-6 bg-white rounded-xl p-6 shadow-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Fire Calls</span>
                  <span>{Math.round((currentMonthStats.fires / (totalCalls || 1)) * 100)}%</span>
                </div>
                <motion.div
                  className="h-2 bg-gray-200 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full bg-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentMonthStats.fires / (totalCalls || 1)) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </motion.div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Medical Calls</span>
                  <span>{Math.round((currentMonthStats.medical / (totalCalls || 1)) * 100)}%</span>
                </div>
                <motion.div
                  className="h-2 bg-gray-200 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentMonthStats.medical / (totalCalls || 1)) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="yearly"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl p-6 shadow-lg"
          >
            <div className="space-y-4">
              {yearlyStats.map((stat, index) => (
                <motion.div
                  key={stat.year}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  <div className="w-20 text-lg font-semibold">{stat.year}</div>
                  <div className="flex-1">
                    <motion.div
                      className="h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stat.total_calls / Math.max(...yearlyStats.map(s => s.total_calls))) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <div className="h-full flex items-center justify-end pr-2 text-white font-medium">
                        {stat.total_calls}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center text-sm text-gray-500">
        {activeChart === 'monthly' ? (
          <p>Use the arrows to navigate between months</p>
        ) : (
          <p>Showing historical call volume from {Math.min(...yearlyStats.map(s => s.year))} to {currentYear}</p>
        )}
      </div>
    </div>
  );
}