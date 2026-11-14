import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../shared/Badge';
import { Clock, Users, ArrowUpDown, ChevronRight } from 'lucide-react';

export function OfficerQueueTable({ issues = [], departmentName }) {
  if (!issues || issues.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">Queue is clear!</h3>
        <p className="text-xs text-slate-500">There are currently no open civic issues requiring departmental action.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Department Action Queue</h3>
          <p className="text-xs text-slate-500">
            Sorted by computed priority score &middot; {issues.length} active issue{issues.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3.5">Reference</th>
              <th className="px-4 py-3.5">Title & Location</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Priority (Score)</th>
              <th className="px-4 py-3.5 text-center">Reports</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">SLA Deadline</th>
              <th className="px-4 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {issues.map((issue) => (
              <tr key={issue.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                  {issue.reference_no}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <span className="font-semibold text-slate-900 dark:text-white block line-clamp-1">{issue.title}</span>
                  <span className="text-[11px] text-slate-400 block line-clamp-1">{issue.address_text || 'Coordinates specified'}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <CategoryBadge category={issue.category} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <PriorityBadge priority={issue.priority} score={issue.priority_score} />
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap font-medium">
                  {issue.report_count > 1 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
                      <Users className="w-3 h-3" /> {issue.report_count}
                    </span>
                  ) : (
                    '1'
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={issue.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[11px]">
                  {issue.sla_due_at ? (
                    <span className={new Date(issue.sla_due_at) < new Date() ? 'text-red-600 font-bold' : 'text-slate-500'}>
                      {new Date(issue.sla_due_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link
                    to={`/officer/issues/${issue.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 font-semibold transition-colors"
                  >
                    Manage <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
