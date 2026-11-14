import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReportDetail } from '../hooks/useReports';
import { useReopenIssue } from '../hooks/useIssues';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/shared/Badge';
import { ComplaintDocument } from '../components/agents/ComplaintDocument';
import { DuplicateMergeNotice } from '../components/agents/DuplicateMergeNotice';
import { SignedImage, LoadingSpinner } from '../components/shared/LoadingSpinner';
import {
  Clock,
  MapPin,
  Bot,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

export function ReportDetail() {
  const { reportId } = useParams();
  const { data, isLoading, error } = useReportDetail(reportId);
  const reopenIssue = useReopenIssue();

  const [reopenNote, setReopenNote] = useState('');
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);

  if (isLoading) return <LoadingSpinner message="Loading report detail..." />;
  if (error || !data?.report) {
    return (
      <div className="py-12 text-center text-sm text-red-600">
        Report could not be retrieved: {error?.message || 'Not found'}
      </div>
    );
  }

  const report = data.report;
  const issue = report.issues;
  const ai = report.ai_analysis;
  const isResolved = issue?.status === 'resolved';

  const handleReopen = async () => {
    if (!issue?.id) return;
    await reopenIssue.mutateAsync({
      issueId: issue.id,
      note: reopenNote || 'Citizen confirmed issue is still not fixed on-site.',
    });
    setShowReopenConfirm(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Top Breadcrumb & Reference */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          to="/my-reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Reports
        </Link>

        {issue?.reference_no && (
          <Link
            to={`/issues/${issue.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Public Tracker ({issue.reference_no}) <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Duplicate Notice if merged */}
      {report.is_duplicate && issue && (
        <DuplicateMergeNotice issue={issue} reportCount={issue.report_count} />
      )}

      {/* "Still Not Fixed" Reopen Banner on Resolved Issues */}
      {isResolved && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Action Required: Citizen Verification
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Is this issue resolved in the real world?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                The municipal field team marked this issue as resolved. If the problem persists on-site, you can reopen it to alert supervisory officers.
              </p>
            </div>

            <button
              onClick={() => setShowReopenConfirm(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm shrink-0"
            >
              <RotateCcw className="w-4 h-4" /> Still Not Fixed (Reopen)
            </button>
          </div>

          {/* Reopen Prompt Modal */}
          {showReopenConfirm && (
            <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Field verification notes for the officer:
              </label>
              <textarea
                rows={2}
                value={reopenNote}
                onChange={(e) => setReopenNote(e.target.value)}
                placeholder="Describe what is still broken or incomplete..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowReopenConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReopen}
                  disabled={reopenIssue.isPending}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg text-white bg-red-600 hover:bg-red-700"
                >
                  {reopenIssue.isPending ? 'Reopening...' : 'Confirm Reopen'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Report Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Evidence & Location */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Citizen Evidence</span>
              {issue?.status && <StatusBadge status={issue.status} />}
            </div>

            {report.imageUrl && (
              <div className="rounded-xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center">
                <SignedImage src={report.imageUrl} alt="Evidence" className="w-full h-full object-contain" />
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">DESCRIPTION</span>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {report.description || 'No descriptive text provided.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {[report.address_text, report.landmark].filter(Boolean).join(' · ') || `Lat: ${report.latitude}, Lng: ${report.longitude}`}
              </span>
            </div>
          </div>

          {/* Structured Complaint */}
          {issue?.complaint && (
            <ComplaintDocument
              complaint={issue.complaint}
              referenceNo={issue.reference_no}
              departmentName={issue.departments?.name}
              priority={issue.priority}
              slaDueAt={issue.sla_due_at}
            />
          )}
        </div>

        {/* Right: AI Vision & Intake Analysis */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Intake Analysis</h3>
            </div>

            {ai ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">CLASSIFICATION</span>
                  <CategoryBadge category={ai.category} />
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">CONFIDENCE</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full"
                        style={{ width: `${Math.round(ai.confidence * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {Math.round(ai.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">DETECTED HAZARD CUES</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(ai.hazard_cues || []).map((cue) => (
                      <span key={cue} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                        {cue.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 block mb-0.5">AGENT REASONING</span>
                  <p className="text-slate-700 dark:text-slate-300 italic">
                    "{ai.reasoning}"
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Analysis pending...</p>
            )}
          </div>

          {/* Department Card */}
          {issue?.departments && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2 text-xs">
              <span className="text-slate-500 uppercase tracking-wider font-semibold block">Responsible Department</span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {issue.departments.name} ({issue.departments.code})
              </h4>
              <p className="text-slate-500">{issue.departments.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
