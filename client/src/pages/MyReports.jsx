import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserReports } from '../hooks/useReports';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/shared/Badge';
import { SignedImage, LoadingSpinner, EmptyState } from '../components/shared/LoadingSpinner';
import { PlusCircle, Clock, CopyCheck, ChevronRight, FileQuestion } from 'lucide-react';

export function MyReports() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useUserReports(page, 10);

  if (isLoading) {
    return <LoadingSpinner message="Fetching your submitted civic reports..." />;
  }

  const reports = data?.reports || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Civic Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time progress, AI classification, and departmental updates for your reports
          </p>
        </div>

        <Link
          to="/report/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> New Report
        </Link>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No Reports Filed Yet"
          description="Have you spotted an overflowing bin, pothole, or broken streetlight? Report it in under 60 seconds."
          action={
            <Link
              to="/report/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Submit Your First Report
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const linkedIssue = report.issues;
            return (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail if present */}
                    {report.imageUrl ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                        <SignedImage src={report.imageUrl} alt="Report thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 text-xs font-semibold">
                        Text
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {linkedIssue?.reference_no && (
                          <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                            {linkedIssue.reference_no}
                          </span>
                        )}
                        {linkedIssue?.category && <CategoryBadge category={linkedIssue.category} />}
                        {report.is_duplicate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            <CopyCheck className="w-3 h-3" /> Corroborated Merge
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors line-clamp-1">
                        {linkedIssue?.title || report.description?.slice(0, 80) || 'Civic issue report'}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        {report.address_text || `Lat: ${report.latitude.toFixed(4)}, Lng: ${report.longitude.toFixed(4)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      {linkedIssue?.status ? (
                        <StatusBadge status={linkedIssue.status} />
                      ) : (
                        <span className="text-xs text-slate-400 capitalize">{report.state}</span>
                      )}
                      <span className="block text-[10px] text-slate-400 mt-1">
                        {new Date(report.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
