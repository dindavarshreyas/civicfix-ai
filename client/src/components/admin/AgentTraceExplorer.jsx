import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock, Search, Filter } from 'lucide-react';

export function AgentTraceExplorer({ runs = [], total = 0, onFilterChange }) {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAgentChange = (e) => {
    setSelectedAgent(e.target.value);
    if (onFilterChange) onFilterChange({ agent_name: e.target.value || undefined, status: selectedStatus || undefined });
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    if (onFilterChange) onFilterChange({ agent_name: selectedAgent || undefined, status: e.target.value || undefined });
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-teal-600" /> Filter Trace Runs:
        </div>
        <select
          value={selectedAgent}
          onChange={handleAgentChange}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
        >
          <option value="">All Agents</option>
          <option value="orchestrator">Orchestrator</option>
          <option value="vision_intake">Vision & Intake</option>
          <option value="routing">Department Routing</option>
          <option value="duplicate">Duplicate Detection & Merge</option>
          <option value="priority">Priority & Severity</option>
          <option value="complaint">Complaint Drafting</option>
          <option value="notification">Notification</option>
          <option value="status">Status Engine</option>
        </select>

        <select
          value={selectedStatus}
          onChange={handleStatusChange}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
        >
          <option value="">All Statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="fallback">Fallback (Heuristic)</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
        </select>

        <span className="text-xs text-slate-400 ml-auto">{total} traces logged</span>
      </div>

      {/* Traces List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {runs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No agent trace logs match your criteria.
          </div>
        ) : (
          runs.map((run) => {
            const isExpanded = expandedId === run.id;
            return (
              <div key={run.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <div
                  onClick={() => toggleExpand(run.id)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                          {run.agent_name.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            run.status === 'succeeded'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : run.status === 'fallback'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {run.reasoning || 'No reasoning summary provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 font-mono shrink-0">
                    <span className="hidden sm:inline-block text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {run.model || 'gemini-2.5-flash'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {run.latency_ms || 1}ms
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Expanded Details / JSON Inspector */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-xs space-y-4">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Human-Readable Officer Audit Reasoning:
                      </span>
                      <p className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                        {run.reasoning}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Input Context Summary:
                        </span>
                        <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono max-h-56">
                          {JSON.stringify(run.input_summary, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Raw Structured Output JSON:
                        </span>
                        <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono max-h-56">
                          {JSON.stringify(run.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
