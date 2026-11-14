import React, { useState } from 'react';
import { Copy, Printer, Check, FileCheck2, Building2, Calendar } from 'lucide-react';

export function ComplaintDocument({ complaint, referenceNo, departmentName, priority, slaDueAt }) {
  const [copied, setCopied] = useState(false);

  if (!complaint) return null;

  const handleCopy = () => {
    const text = `
REF: ${referenceNo || 'N/A'}
DEPARTMENT: ${departmentName || 'Responsible Municipal Department'}
SUBJECT: ${complaint.subject || ''}

${complaint.salutation || 'Dear Officer,'}

${complaint.body || ''}

LOCATION:
${complaint.location_block || ''}

EVIDENCE SUMMARY:
${complaint.evidence_summary || ''}

REQUESTED ACTION:
${complaint.requested_action || ''}

TIMELINE:
${complaint.expected_resolution_timeline || 'As per municipal SLA'}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm printable-document">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3 mb-6 no-print">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-teal-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Structured Complaint Document</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Official Document Layout */}
      <div className="space-y-4 font-serif text-slate-800 dark:text-slate-200 text-sm leading-relaxed border-l-4 border-teal-600 pl-5 py-2">
        <div className="font-sans text-xs text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Official Municipal Grievance Filing</span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{referenceNo}</span>
        </div>

        <h4 className="font-sans text-base font-bold text-slate-900 dark:text-white">
          {complaint.subject}
        </h4>

        <p className="font-sans text-xs text-slate-600 dark:text-slate-400 font-semibold">
          {complaint.salutation || `To the Officer-in-Charge, ${departmentName},`}
        </p>

        <p className="whitespace-pre-line text-slate-700 dark:text-slate-300">
          {complaint.body}
        </p>

        <div className="font-sans grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <span className="font-semibold text-slate-500 block mb-1">LOCATION SPECIFICS</span>
            <p className="text-slate-800 dark:text-slate-200">{complaint.location_block}</p>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block mb-1">EVIDENCE SUMMARY</span>
            <p className="text-slate-800 dark:text-slate-200">{complaint.evidence_summary}</p>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block mb-1">REQUESTED ACTION</span>
            <p className="text-slate-800 dark:text-slate-200">{complaint.requested_action}</p>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block mb-1">SLA RESOLUTION TIMELINE</span>
            <p className="text-slate-800 dark:text-slate-200 font-medium">{complaint.expected_resolution_timeline}</p>
          </div>
        </div>

        {/* Addenda if present */}
        {complaint.addenda && complaint.addenda.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 font-sans">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Citizen Addenda & Corroborations ({complaint.addenda.length})
            </h5>
            <div className="space-y-2">
              {complaint.addenda.map((addendum, idx) => (
                <div key={idx} className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg text-xs">
                  <span className="text-[10px] text-slate-400 block mb-1">Reported on {new Date(addendum.reported_at).toLocaleString()}</span>
                  <p className="text-slate-800 dark:text-slate-200">{addendum.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
