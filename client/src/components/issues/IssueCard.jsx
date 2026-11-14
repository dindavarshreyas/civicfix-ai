import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../shared/Badge';
import { SignedImage } from '../shared/LoadingSpinner';
import { Users, Clock, MapPin, ChevronRight } from 'lucide-react';

export function IssueCard({ issue, showLink = true, linkPrefix = '/issues' }) {
  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const cardContent = (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between h-full">
      <div>
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
              {issue.reference_no}
            </span>
            <CategoryBadge category={issue.category} />
          </div>
          <StatusBadge status={issue.status} />
        </div>

        {/* Title & Summary */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors line-clamp-1 mb-1.5">
          {issue.title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {issue.summary}
        </p>

        {/* Image Preview if available */}
        {issue.imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden aspect-video max-h-40 bg-slate-100 dark:bg-slate-800">
            <SignedImage src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Meta Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <PriorityBadge priority={issue.priority} score={issue.priority_score} />
          {issue.report_count > 1 && (
            <span className="inline-flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full text-[11px]">
              <Users className="w-3 h-3" /> {issue.report_count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{timeAgo(issue.last_reported_at || issue.created_at)}</span>
        </div>
      </div>
    </div>
  );

  if (showLink) {
    return (
      <Link to={`${linkPrefix}/${issue.id}`} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
