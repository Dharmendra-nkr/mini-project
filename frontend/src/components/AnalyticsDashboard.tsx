'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Send, Loader2, History, TrendingUp, TrendingDown } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ChartData {
  [key: string]: any;
}

interface AnalyticsResponse {
  session_id: string;
  query_id: number;
  chart_type: 'line' | 'bar' | 'pie' | 'table';
  title: string;
  x_label: string;
  y_label: string;
  data: ChartData[];
  insights: string;
  row_count: number;
  execution_ms: number;
  status: 'success' | 'error';
}

interface QueryHistoryItem {
  id: number;
  natural_language_query: string;
  chart_type: string;
  insights: string;
  row_count: number;
  execution_ms: number;
  created_at: string;
}

const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AnalyticsDashboard() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionId, setSessionId] = useState('');

  // Fetch query history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const getToken = () => {
    // Try sessionStorage first (for manager dashboard), then localStorage
    return sessionStorage.getItem('manager_token') || localStorage.getItem('token') || '';
  };

  const fetchHistory = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/manager/analytics/history?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.queries || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = getToken();
      const params = new URLSearchParams({ message: query });
      if (sessionId) params.append('session_id', sessionId);

      const response = await fetch(`${API_BASE}/api/manager/analytics/chat?${params}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      if (data.status === 'error') {
        setError(data.error || 'An error occurred');
      } else {
        setResult(data);
        setSessionId(data.session_id);
        setQuery('');
        // Refresh history
        setTimeout(fetchHistory, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!result || !result.data || result.data.length === 0) {
      return <div className="text-center py-8 text-gray-500">No data to display</div>;
    }

    const { chart_type, data, x_label, y_label } = result;
    const dataKey = Object.keys(data[0]).find(key => key !== 'name' && typeof data[0][key] === 'number') || Object.keys(data[0])[1];

    switch (chart_type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={Object.keys(data[0])[0]} stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name={y_label}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={Object.keys(data[0])[0]} stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar 
                dataKey={dataKey} 
                fill="#3b82f6"
                name={y_label}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieDataKey = Object.keys(data[0]).find(key => typeof data[0][key] === 'number') || Object.keys(data[0])[1];
        const nameKey = Object.keys(data[0])[0];
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey={pieDataKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'table':
      default:
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(data[0]).map(key => (
                    <th key={key} className="px-4 py-2 text-left font-semibold text-gray-900">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    {Object.values(row).map((val, valIdx) => (
                      <td key={valIdx} className="px-4 py-2 text-gray-700">
                        {typeof val === 'number' ? val.toLocaleString() : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Query</h2>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question... e.g., 'What is the trend of our profit this month?'"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </button>
        </form>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Query History Sidebar */}
      {showHistory && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Queries</h3>
          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-gray-500">No query history</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setQuery(item.natural_language_query);
                    setShowHistory(false);
                  }}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <p className="font-medium text-gray-900 text-sm">{item.natural_language_query}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-600">
                    <span>📊 {item.chart_type}</span>
                    <span>📈 {item.row_count} rows</span>
                    <span>⚡ {item.execution_ms}ms</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Chart Title & Metadata */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{result.title}</h3>
                <div className="flex gap-6 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    📊 <strong>{result.row_count}</strong> data points
                  </span>
                  <span className="flex items-center gap-1">
                    ⚡ <strong>{result.execution_ms}ms</strong> execution time
                  </span>
                  <span className="flex items-center gap-1">
                    🔷 Chart type: <strong>{result.chart_type}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-100">
              {renderChart()}
            </div>
          </div>

          {/* Insights */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">AI Insights</h4>
                <p className="text-gray-700 leading-relaxed">{result.insights}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !error && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-12 border border-blue-200 text-center">
          <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ask a Question</h3>
          <p className="text-gray-600 mb-6">
            Use natural language to query your resort analytics. Try questions like:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            <div className="p-3 bg-white rounded border border-gray-200 text-sm text-left">
              💰 "What is the trend of our profit this month?"
            </div>
            <div className="p-3 bg-white rounded border border-gray-200 text-sm text-left">
              📊 "Compare revenue by wing"
            </div>
            <div className="p-3 bg-white rounded border border-gray-200 text-sm text-left">
              🏢 "Show room type breakdown %"
            </div>
            <div className="p-3 bg-white rounded border border-gray-200 text-sm text-left">
              📈 "Occupancy rate by floor"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
