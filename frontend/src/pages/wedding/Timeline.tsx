import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '../../lib/api-client';

interface TimelineFunction {
  function_id: string;
  name: string;
  type: string;
  date: string;
  time?: string;
  venue: string;
  status: 'completed' | 'pending' | 'overdue' | 'today';
  countdown: {
    days: number;
    isToday: boolean;
    isOverdue: boolean;
  };
  color_code: string;
}

interface TimelineData {
  wedding_date: string;
  wedding_name: string;
  days_until_wedding: number;
  total_functions: number;
  timeline: TimelineFunction[];
  completion_stats: {
    completed: number;
    pending: number;
    overdue: number;
  };
}

export default function Timeline() {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);

  const weddingId = new URLSearchParams(window.location.search).get('wedding_id');

  useEffect(() => {
    fetchTimeline();
  }, [weddingId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/weddings/${weddingId}/timeline`);
      setTimelineData(response.data);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!timelineData) return null;

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={16} />,
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock size={16} />,
      },
      overdue: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle size={16} />,
      },
      today: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <Calendar size={16} />,
      },
    };
    const badge = badges[status] || badges.pending;
    return badge;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Wedding Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg shadow-xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">{timelineData.wedding_name}</h1>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-pink-100">Days Until Wedding</p>
              <p className="text-5xl font-bold">{timelineData.days_until_wedding}</p>
            </div>
            <div>
              <p className="text-pink-100">Wedding Date</p>
              <p className="text-2xl font-bold">
                {new Date(timelineData.wedding_date).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-pink-100">Functions Scheduled</p>
              <p className="text-3xl font-bold">{timelineData.total_functions}</p>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm font-semibold">Completed</p>
            <p className="text-3xl font-bold text-green-600">
              {timelineData.completion_stats.completed}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm font-semibold">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {timelineData.completion_stats.pending}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm font-semibold">Overdue</p>
            <p className="text-3xl font-bold text-red-600">
              {timelineData.completion_stats.overdue}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Wedding Timeline</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-400 to-blue-400"></div>

            {/* Timeline items */}
            <div className="space-y-8">
              {timelineData.timeline.map((func, index) => {
                const badge = getStatusBadge(func.status);
                const funcDate = new Date(func.date);
                const formattedDate = funcDate.toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div key={func.function_id} className="relative pl-24">
                    {/* Timeline dot */}
                    <div
                      className="absolute left-0 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: func.color_code }}
                    >
                      {func.countdown.days === 0 && (
                        <span className="text-white font-bold text-sm">TODAY</span>
                      )}
                      {func.countdown.days > 0 && (
                        <span className="text-white font-bold text-lg">{func.countdown.days}d</span>
                      )}
                      {func.countdown.isOverdue && (
                        <span className="text-white font-bold text-sm">OVERDUE</span>
                      )}
                    </div>

                    {/* Function card */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border-l-4 border-pink-400">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 capitalize">
                            {func.name}
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">
                            {func.type.replace('_', ' ')}
                          </p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                          {badge.icon}
                          <span className="text-sm font-semibold capitalize">{func.status}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar size={16} className="text-pink-600" />
                          <span>{formattedDate}</span>
                        </div>
                        {func.time && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock size={16} className="text-pink-600" />
                            <span>{func.time}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-700 col-span-2">
                          <MapPin size={16} className="text-pink-600" />
                          <span>{func.venue || 'TBD'}</span>
                        </div>
                      </div>

                      {/* Countdown status */}
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        {func.countdown.isToday && (
                          <p className="text-blue-600 font-semibold text-sm">🎉 This event is TODAY!</p>
                        )}
                        {func.countdown.isOverdue && (
                          <p className="text-red-600 font-semibold text-sm">⚠️ This event is overdue</p>
                        )}
                        {!func.countdown.isToday && !func.countdown.isOverdue && func.countdown.days > 0 && (
                          <p className="text-gray-600 text-sm">
                            ⏱️ {func.countdown.days} day{func.countdown.days !== 1 ? 's' : ''} away
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500"></div>
              <span className="text-gray-700">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-500"></div>
              <span className="text-gray-700">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-500"></div>
              <span className="text-gray-700">Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500"></div>
              <span className="text-gray-700">Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
