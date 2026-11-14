import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePublicIssues } from '../hooks/useIssues';
import { OfficerQueueTable } from '../components/officer/OfficerQueueTable';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ShieldCheck, Filter } from 'lucide-react';

export function OfficerQueue() {
  const { profile, department, role } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('');

  const queryFilters = {
    department_id: role === 'officer' ? profile?.department_id : undefined,
    status: selectedStatus || undefined,
    pageSize: 50,
  };

  const { data, isLoading } = usePublicIssues(queryFilters);
  const issues = data?.issues || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Officer Department Queue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department: <strong className="text-slate-800 dark:text-slate-200">{department?.name || 'All Municipal Divisions'}</strong>
          </p>
        </div>

        {/* Filter status */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Active Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="triaged">Triaged</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="reopened">Reopened</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Fetching prioritized department queue..." />
      ) : (
        <OfficerQueueTable issues={issues} departmentName={department?.name} />
      )}
    </div>
  );
}
