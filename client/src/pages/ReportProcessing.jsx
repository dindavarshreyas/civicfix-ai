import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAgentProgress } from '../hooks/useAgentProgress';
import { AgentPipelineProgress } from '../components/agents/AgentPipelineProgress';
import { DuplicateMergeNotice } from '../components/agents/DuplicateMergeNotice';
import { ComplaintDocument } from '../components/agents/ComplaintDocument';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/shared/Badge';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Sparkles, ArrowRight, ClipboardList, CheckCircle2, AlertOctagon } from 'lucide-react';

export function ReportProcessing() {
  const { reportId } = useParams();
  const { data: progress, isLoading, error } = useAgentProgress(reportId);

  if (isLoading) {
    return <LoadingSpinner message="Connecting to autonomous multi-agent pipeline..." />;
  }

  if (error || !progress) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="bg-red-50 dark:bg-red-950/40 p-6 rounded-2xl border border-red-200 dark:border-red-800">
          <AlertOctagon className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-red-900 dark:text-red-200">Unable to load report progress</h3>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error?.message || 'Report not found'}</p>
          <Link to="/my-reports" className="inline-block mt-4 text-xs font-semibold text-teal-600 underline">
            Go to My Reports
          </Link>
        </div>
      </div>
    );
  }

  const { state, isDuplicate, issue, steps, errorMessage } = progress;
  const isDone = state === 'processed';

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
            REPORT #{reportId.slice(0, 8)}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            {isDone ? 'Grievance Formally Filed' : 'AI Agents Processing Your Report'}
          </h1>
        </div>

        {isDone && issue && (
          <Link
            to={`/issues/${issue.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm shrink-0"
          >
            Track Public Issue
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Outcome Banner if duplicate or complete */}
      {isDone && isDuplicate && issue && (
        <DuplicateMergeNotice issue={issue} reportCount={issue.report_count} />
      )}

      {/* If newly created issue summary banner */}
      {isDone && !isDuplicate && issue && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  New Canonical Grievance Registered
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Reference: {issue.reference_no}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-xl">
                  {issue.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CategoryBadge category={issue.category} />
              <PriorityBadge priority={issue.priority} score={issue.priority_score} />
            </div>
          </div>
        </div>
      )}

      {/* Stepper Component showing real-time agent execution */}
      <AgentPipelineProgress steps={steps} state={state} errorMessage={errorMessage} />

      {/* Drafted Complaint Document if complete */}
      {isDone && issue?.complaint && (
        <ComplaintDocument
          complaint={issue.complaint}
          referenceNo={issue.reference_no}
          departmentName={issue.departments?.name}
          priority={issue.priority}
          slaDueAt={issue.sla_due_at}
        />
      )}

      {/* Footer navigation */}
      <div className="flex items-center justify-between pt-4">
        <Link
          to="/my-reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600"
        >
          <ClipboardList className="w-4 h-4" /> View in My Reports
        </Link>
        <Link
          to="/report/new"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
        >
          Report Another Issue &rarr;
        </Link>
      </div>
    </div>
  );
}
