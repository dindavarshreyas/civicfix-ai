import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  useOfficerIssueDetail,
  useUpdateIssueStatus,
  useOverrideIssue,
} from '../hooks/useIssues';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/shared/Badge';
import { IssueActionPanel } from '../components/officer/IssueActionPanel';
import { OverrideModal } from '../components/officer/OverrideModal';
import { StatusTimeline } from '../components/issues/StatusTimeline';
import { ComplaintDocument } from '../components/agents/ComplaintDocument';
import { SignedImage, LoadingSpinner } from '../components/shared/LoadingSpinner';
import {
  ShieldCheck,
  ChevronLeft,
  Users,
  MapPin,
  Clock,
  Sparkles,
  SlidersHorizontal,
  History,
  FileCheck2,
} from 'lucide-react';

export function OfficerIssue() {
  const { issueId } = useParams();
  const { data, isLoading, error } = useOfficerIssueDetail(issueId);
  const updateStatus = useUpdateIssueStatus();
  const overrideIssue = useOverrideIssue();

  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  // Departments list for override modal
  const { data: deptData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => api.get('/departments'),
  });

  if (isLoading) return <LoadingSpinner message="Loading departmental issue file..." />;
  if (error || !data?.issue) {
    return (
      <div className="py-12 text-center text-sm text-red-600">
        Issue file could not be loaded: {error?.message}
      </div>
    );
  }

  const issue = data.issue;
  const reports = issue.reports || [];
  const overrides = issue.overrides || [];

  const handleStatusUpdate = async ({ status, note }) => {
    await updateStatus.mutateAsync({ issueId: issue.id, status, note });
  };

  const handleApplyOverride = async ({ field, newValue, reason }) => {
    await overrideIssue.mutateAsync({ issueId: issue.id, field, newValue, reason });
  };

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          to="/officer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Queue
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
            {issue.reference_no}
          </span>
          {issue.ai_overridden && (
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              AI Overridden
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Left is details, Right is Officer Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <CategoryBadge category={issue.category} />
                <PriorityBadge priority={issue.priority} score={issue.priority_score} />
              </div>
              <StatusBadge status={issue.status} />
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {issue.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {issue.summary}
            </p>

            {/* Photo if present */}
            {issue.primaryImageUrl && (
              <div className="rounded-2xl overflow-hidden aspect-video max-h-80 bg-slate-900 flex items-center justify-center">
                <SignedImage src={issue.primaryImageUrl} alt={issue.title} className="w-full h-full object-contain" />
              </div>
            )}

            {/* Location & Meta */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{issue.address_text || `Lat: ${issue.latitude.toFixed(4)}, Lng: ${issue.longitude.toFixed(4)}`}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{issue.report_count} citizen{issue.report_count !== 1 ? 's' : ''} reported</span>
              </div>
            </div>
          </div>

          {/* Anonymized Corroborating Citizen Reports */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Corroborating Reports ({reports.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Reporter identities anonymized</span>
            </div>

            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-teal-700 dark:text-teal-400">{rep.reporterLabel}</span>
                    <span className="text-slate-400 font-normal">{new Date(rep.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    {rep.description || 'Submitted photo evidence only.'}
                  </p>
                  {rep.imageUrl && (
                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 mt-2">
                      <SignedImage src={rep.imageUrl} alt="Corroboration" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Structured Formal Complaint */}
          {issue.complaint && (
            <ComplaintDocument
              complaint={issue.complaint}
              referenceNo={issue.reference_no}
              departmentName={issue.departments?.name}
              priority={issue.priority}
              slaDueAt={issue.sla_due_at}
            />
          )}

          {/* Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Audit & Status Progression History
            </h3>
            <StatusTimeline timeline={issue.timeline} />
          </div>
        </div>

        {/* Right Column: Actions & Overrides */}
        <div className="space-y-6">
          <IssueActionPanel
            issue={issue}
            onUpdateStatus={handleStatusUpdate}
            onOpenOverride={() => setIsOverrideOpen(true)}
          />

          {/* Override History if any */}
          {overrides.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <History className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Officer Override Log ({overrides.length})
                </h4>
              </div>

              <div className="space-y-2.5">
                {overrides.map((ov) => (
                  <div key={ov.id} className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>Changed {ov.field}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(ov.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      From <del>{ov.old_value}</del> to <strong>{ov.new_value}</strong>
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 italic pt-1">
                      "{ov.reason}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <OverrideModal
        isOpen={isOverrideOpen}
        onClose={() => setIsOverrideOpen(false)}
        onOverride={handleApplyOverride}
        currentIssue={issue}
        departments={deptData?.departments || []}
      />
    </div>
  );
}
