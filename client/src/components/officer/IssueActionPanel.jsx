import React, { useState } from 'react';
import { ALLOWED_STATUS_TRANSITIONS } from '../../../../server/src/config/constants';
import { StatusBadge } from '../shared/Badge';
import { ShieldCheck, SlidersHorizontal, AlertCircle } from 'lucide-react';

export function IssueActionPanel({ issue, onUpdateStatus, onOpenOverride }) {
  const currentStatus = issue?.status;
  const allowedNext = {
    submitted: ['triaged', 'rejected'],
    triaged: ['assigned', 'rejected'],
    assigned: ['in_progress', 'rejected'],
    in_progress: ['resolved', 'rejected'],
    resolved: ['closed'],
    reopened: ['assigned', 'in_progress', 'rejected'],
    closed: [],
    rejected: [],
  }[currentStatus] || [];

  const [selectedStatus, setSelectedStatus] = useState(allowedNext[0] || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) return;

    if (selectedStatus === 'rejected' && (!note || note.trim().length < 5)) {
      setError('A rejection explanation note of at least 5 characters is required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onUpdateStatus({ status: selectedStatus, note });
      setNote('');
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTerminal = ['closed', 'rejected'].includes(currentStatus);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Officer Action Controls</h3>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      {isTerminal ? (
        <p className="text-xs text-slate-500">
          This issue is marked as <strong className="uppercase">{currentStatus}</strong> and is in a terminal state.
        </p>
      ) : (
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Advance Workflow Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {allowedNext.map((st) => (
                <option key={st} value={st}>
                  Move to: {st.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Official Note / Field Inspection Comments {selectedStatus === 'rejected' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Work crew dispatched with asphalt repair truck. Expected turnaround 4h."
              maxLength={500}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !selectedStatus}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Updating Status...' : 'Apply Status Update & Notify Citizens'}
          </button>
        </form>
      )}

      {/* Override button */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">AI Classification Override</span>
          <span className="text-[11px] text-slate-400">Reassign department, change category, or escalate priority</span>
        </div>
        <button
          type="button"
          onClick={onOpenOverride}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 transition-colors shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" /> Override AI
        </button>
      </div>
    </div>
  );
}
