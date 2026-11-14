import React from 'react';
import { Compass, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center text-white">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">CivicMind</span>
          <span className="text-xs text-slate-500">· Autonomous Agentic AI Civic Issue Coordinator</span>
        </div>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          Built for smart, responsive, and accountable city governance
        </p>
      </div>
    </footer>
  );
}
