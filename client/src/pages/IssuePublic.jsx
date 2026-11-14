import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePublicIssue } from '../hooks/useIssues';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/shared/Badge';
import { StatusTimeline } from '../components/issues/StatusTimeline';
import { SignedImage, LoadingSpinner } from '../components/shared/LoadingSpinner';
import { HazardAdvisoryBanner } from '../components/report/EmergencyAdvisoryBanner';
import { Users, Clock, MapPin, Building2, ChevronLeft, ShieldCheck } from 'lucide-react';

export function IssuePublic() {
  const { issueId } = useParams();
  const { data, isLoading, error } = usePublicIssue(issueId);

  if (isLoading) return <LoadingSpinner message="Retrieving public issue details..." />;
  if (error || !data?.issue) {
    return (
      <div className="py-12 text-center text-sm text-red-600">
        Issue not found: {error?.message}
      </div>
    );
  }

  const issue = data.issue;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/map"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Public Map
        </Link>
      </div>

      {/* Main Issue Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-teal-600 dark:text-teal-400">
              {issue.reference_no}
            </span>
            <CategoryBadge category={issue.category} />
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={issue.priority} score={issue.priority_score} />
            <StatusBadge status={issue.status} />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {issue.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            {issue.summary}
          </p>
        </div>

        <HazardAdvisoryBanner category={issue.category} />

        {/* Image Preview if available */}
        {issue.imageUrl && (
          <div className="rounded-2xl overflow-hidden aspect-video max-h-96 bg-slate-900 flex items-center justify-center">
            <SignedImage src={issue.imageUrl} alt={issue.title} className="w-full h-full object-contain" />
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="line-clamp-1">{issue.address_text || `Lat ${issue.latitude.toFixed(4)}, Lng ${issue.longitude.toFixed(4)}`}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{issue.report_count} citizen{issue.report_count > 1 ? 's' : ''} reported</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{issue.departments?.name || 'Department Assigned'}</span>
          </div>
        </div>
      </div>

      {/* Public Safe Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Public Status Progression</h3>
          <span className="text-xs text-slate-400">Official Municipal Log</span>
        </div>

        <StatusTimeline timeline={issue.timeline} />
      </div>
    </div>
  );
}
