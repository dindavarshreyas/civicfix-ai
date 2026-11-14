import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size] || 'w-8 h-8';

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500 dark:text-slate-400">
      <Loader2 className={`${sizeClass} animate-spin text-teal-600 mb-2`} />
      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50">
      {Icon && <Icon className="w-12 h-12 text-slate-400 mb-4" />}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'teal' }) {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.teal}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export function SignedImage({ src, alt, className = 'w-full h-48 object-cover rounded-lg' }) {
  if (!src) {
    return (
      <div className={`${className} bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs`}>
        No image provided
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Civic issue evidence'}
      className={className}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
