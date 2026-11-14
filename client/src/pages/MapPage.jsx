import React, { useState } from 'react';
import { usePublicIssues } from '../hooks/useIssues';
import { IssueMap } from '../components/map/IssueMap';
import { MapLegend } from '../components/map/MapLegend';
import { IssueFilters } from '../components/issues/IssueFilters';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Map as MapIcon, Layers } from 'lucide-react';

export function MapPage() {
  const [filters, setFilters] = useState({ pageSize: 100 });
  const { data, isLoading } = usePublicIssues(filters);

  const issues = data?.issues || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Live Public Issue Map</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified municipal problems across the city. Colored by assessed priority severity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MapLegend />
        </div>
      </div>

      <IssueFilters
        filters={filters}
        setFilters={setFilters}
        onReset={() => setFilters({ pageSize: 100 })}
      />

      {isLoading ? (
        <LoadingSpinner message="Plotting civic markers on map..." />
      ) : (
        <div className="relative">
          <IssueMap issues={issues} />
          <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-md">
            Showing {issues.length} active issue{issues.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
