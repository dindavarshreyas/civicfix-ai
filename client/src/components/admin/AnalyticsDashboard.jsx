import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { StatCard } from '../shared/LoadingSpinner';
import { CheckCircle2, AlertOctagon, CopyCheck, Clock, Layers, Users } from 'lucide-react';

const STATUS_COLORS = {
  submitted: '#3b82f6',
  triaged: '#a855f7',
  assigned: '#6366f1',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  closed: '#64748b',
  reopened: '#f43f5e',
  rejected: '#ef4444',
};

export function AnalyticsDashboard({ stats }) {
  if (!stats) return null;

  // Format category bar data
  const categoryData = Object.entries(stats.categoryCounts || {}).map(([key, val]) => ({
    category: key.replace('_', ' ').toUpperCase(),
    count: val,
  }));

  // Format status donut data
  const statusData = Object.entries(stats.statusCounts || {}).map(([key, val]) => ({
    name: key.replace('_', ' ').toUpperCase(),
    value: val,
    color: STATUS_COLORS[key] || '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Issues Filed"
          value={stats.totalIssues || 0}
          subtitle={`${stats.totalReports || 0} citizen submissions`}
          icon={Layers}
          color="teal"
        />
        <StatCard
          title="Avg Resolution Time"
          value={`${stats.avgResolutionHours || 0} hrs`}
          subtitle="From submission to verification"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Merged Duplicates"
          value={stats.totalReportsMerged || 0}
          subtitle={`${Math.round((stats.duplicateMergeRatio || 0) * 100)}% auto-merge efficiency`}
          icon={CopyCheck}
          color="purple"
        />
        <StatCard
          title="SLA Breaches"
          value={stats.slaBreachCount || 0}
          subtitle="Past targeted resolution deadline"
          icon={AlertOctagon}
          color={stats.slaBreachCount > 0 ? 'red' : 'amber'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            Issue Distribution by Category
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie/Donut Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            Current Status Distribution
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 30-Day Trend Line Chart */}
      {stats.trend && stats.trend.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
            30-Day Submission vs. Resolution Trajectory
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="created" stroke="#0d9488" strokeWidth={2.5} name="Issues Reported" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} name="Issues Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
