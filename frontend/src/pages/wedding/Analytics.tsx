import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface DashboardStats {
  budget: { total: number; spent: number };
  functions: { total: number; completed: number };
  rsvps: { confirmed: number; total_invited: number };
  packing: { average_completion: string };
  updated_at: string;
}

export function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weddingId = new URLSearchParams(window.location.search).get('wedding_id');

  useEffect(() => {
    fetchAnalytics();
  }, [weddingId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/weddings/${weddingId}/analytics/dashboard`);
      setStats(response.data);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700">{error || 'Failed to load analytics'}</p>
          </div>
        </div>
      </div>
    );
  }

  const budgetPercentage = stats.budget.total > 0
    ? Math.round((stats.budget.spent / stats.budget.total) * 100)
    : 0;

  const functionPercentage = stats.functions.total > 0
    ? Math.round((stats.functions.completed / stats.functions.total) * 100)
    : 0;

  const rsvpPercentage = stats.rsvps.total_invited > 0
    ? Math.round((stats.rsvps.confirmed / stats.rsvps.total_invited) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Wedding Analytics</h1>
          <p className="text-gray-600">
            Last updated: {new Date(stats.updated_at).toLocaleString()}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Budget Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Budget</h3>
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">₹{stats.budget.spent.toLocaleString()}</p>
              <p className="text-sm text-gray-500">of ₹{stats.budget.total.toLocaleString()}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{budgetPercentage}% spent</p>
          </div>

          {/* Functions Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Functions</h3>
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">{stats.functions.completed}</p>
              <p className="text-sm text-gray-500">of {stats.functions.total} completed</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${functionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{functionPercentage}% complete</p>
          </div>

          {/* RSVP Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">RSVPs</h3>
              <Users className="text-purple-600" size={24} />
            </div>
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">{stats.rsvps.confirmed}</p>
              <p className="text-sm text-gray-500">of {stats.rsvps.total_invited} confirmed</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${rsvpPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{rsvpPercentage}% response</p>
          </div>

          {/* Packing Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-semibold">Packing</h3>
              <TrendingUp className="text-orange-600" size={24} />
            </div>
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">{stats.packing.average_completion}%</p>
              <p className="text-sm text-gray-500">average completion</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${parseFloat(stats.packing.average_completion)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">On track</p>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={fetchAnalytics}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Refresh Analytics
          </button>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Metrics</h2>
          <div className="space-y-3 text-gray-700">
            <p>• <strong>Budget Status:</strong> Monitor spending across all categories</p>
            <p>• <strong>Function Progress:</strong> Track completion of wedding functions</p>
            <p>• <strong>RSVP Tracking:</strong> Monitor guest confirmations</p>
            <p>• <strong>Packing Progress:</strong> Track packing list completion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
