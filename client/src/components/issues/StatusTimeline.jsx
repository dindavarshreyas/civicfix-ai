import React from 'react';
import { StatusBadge } from '../shared/Badge';
import { CheckCircle2, Clock, Bot, UserCheck, User, Wrench, RefreshCw } from 'lucide-react';

export function StatusTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        No status history recorded yet.
      </div>
    );
  }

  const getActorBadge = (actorType) => {
    switch (actorType) {
      case 'agent':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <Bot className="w-3 h-3" /> Autonomous Agent
          </span>
        );
      case 'officer':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <UserCheck className="w-3 h-3" /> Field Officer
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            Municipal Admin
          </span>
        );
      case 'citizen':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            <User className="w-3 h-3" /> Citizen Reporter
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Wrench className="w-3 h-3" /> System Scheduler
          </span>
        );
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {timeline.map((item, idx) => (
        <div key={item.id || idx} className="relative group">
          {/* Timeline node */}
          <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-teal-600 flex items-center justify-center shadow-sm">
            <div className="w-2 h-2 rounded-full bg-teal-600"></div>
          </div>

          <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={item.to_status} />
                {getActorBadge(item.actor_type)}
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(item.created_at).toLocaleString()}
              </span>
            </div>

            {item.note && (
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                {item.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
