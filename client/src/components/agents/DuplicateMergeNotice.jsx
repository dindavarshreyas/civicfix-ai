import React from 'react';
import { Link } from 'react-router-dom';
import { CopyCheck, ArrowRight, Users, TrendingUp } from 'lucide-react';

export function DuplicateMergeNotice({ issue, reportCount }) {
  if (!issue) return null;

  return (
    <div className="bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-teal-950/40 dark:to-indigo-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl p-5 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/30">
            <CopyCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Corroborated Issue Merge
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
                <Users className="w-3 h-3" /> {reportCount || issue.report_count} Citizens Corroborated
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              Merged with Canonical Issue {issue.reference_no}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
              Our Duplicate Detection Agent identified that this matches a verified real-world problem at the same spot. Rather than creating fragmented tickets, your report was merged into a unified complaint, escalating its priority for field response.
            </p>
          </div>
        </div>

        <Link
          to={`/issues/${issue.id}`}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shrink-0 shadow-sm"
        >
          View Public Tracker
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
