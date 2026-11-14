import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { BarChart3, Play, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [tickMessage, setTickMessage] = useState(null);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics'),
    refetchInterval: 10000,
  });

  const triggerTickMutation = useMutation({
    mutationFn: () => api.post('/internal/workflow/tick'),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setTickMessage(`Workflow tick executed! Advanced ${data.result?.advancedCount || 0} issue(s).`);
      setTimeout(() => setTickMessage(null), 5000);
    },
    onError: (err) => {
      setTickMessage(`Tick failed: ${err.message}`);
    },
  });

  if (isLoading) return <LoadingSpinner message="Calculating municipal analytics metrics..." />;
  if (error) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        Failed to load analytics: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Demo Manual Workflow Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Admin Command Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics, SLA tracking, and simulated municipal workflow engine controls
          </p>
        </div>

        {/* Demo Manual Tick Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => triggerTickMutation.mutate()}
            disabled={triggerTickMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            title="Forces workflow scheduler to evaluate SLA timers and progress eligible issues"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${triggerTickMutation.isPending ? 'animate-spin' : ''}`} />
            {triggerTickMutation.isPending ? 'Advancing Workflow...' : 'Advance workflow now'}
          </button>
        </div>
      </div>

      {tickMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-600" />
          <span>{tickMessage}</span>
        </div>
      )}

      {/* Analytics Dashboard */}
      <AnalyticsDashboard stats={stats} />
    </div>
  );
}
