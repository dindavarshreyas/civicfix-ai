import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AgentTraceExplorer } from '../components/admin/AgentTraceExplorer';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Cpu, RotateCcw } from 'lucide-react';

export function AgentTrace() {
  const [filters, setFilters] = useState({ page: 1, pageSize: 30 });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-agent-runs', filters],
    queryFn: () => api.get('/agent-runs', filters),
    refetchInterval: 5000, // Real-time poll during active orchestration
  });

  const runs = data?.runs || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Agent Trace Explorer</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete explainability and audit trail: inspect raw agent inputs, structured JSON outputs, model latencies, and reasoning strings
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Refresh Traces
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading agent execution audit log..." />
      ) : (
        <AgentTraceExplorer
          runs={runs}
          total={total}
          onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }))}
        />
      )}
    </div>
  );
}
