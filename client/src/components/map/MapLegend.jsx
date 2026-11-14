import React from 'react';

export function MapLegend() {
  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-md text-xs">
      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">Priority Legend</span>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600"></span>
          <span className="text-slate-600 dark:text-slate-400">Critical (&ge;80)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span className="text-slate-600 dark:text-slate-400">High (60-79)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-slate-600 dark:text-slate-400">Medium (35-59)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-slate-600 dark:text-slate-400">Low (&lt;35)</span>
        </div>
      </div>
    </div>
  );
}
