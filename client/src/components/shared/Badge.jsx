import React from 'react';

export function StatusBadge({ status }) {
  const styles = {
    submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
    triaged: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
    assigned: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200',
    in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 animate-pulse',
    resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
    closed: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
    reopened: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 font-semibold',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
  }[status] || 'bg-slate-100 text-slate-800';

  const label = status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority, score }) {
  const styles = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 font-bold',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 font-semibold',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
    low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
  }[priority] || 'bg-slate-100 text-slate-800 border-slate-300';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {priority?.toUpperCase()}
      {score !== undefined && <span className="opacity-75 font-mono">({score})</span>}
    </span>
  );
}

export function CategoryBadge({ category }) {
  const labels = {
    garbage: 'Garbage & Waste',
    road_damage: 'Road & Pothole',
    streetlight: 'Streetlighting',
    water_leakage: 'Water Leakage',
    drainage: 'Drainage & Flooding',
    other: 'General Civic',
  };

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {labels[category] || category}
    </span>
  );
}
