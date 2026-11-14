import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { LoadingSpinner, EmptyState } from '../components/shared/LoadingSpinner';
import { Bell, CheckCheck, ExternalLink, Clock } from 'lucide-react';

export function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead, isLoading } = useNotifications();

  if (isLoading) return <LoadingSpinner message="Loading notification history..." />;

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Notification Centre</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time status updates delivered by our Notification Agent</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 hover:bg-teal-100 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications Yet"
          description="When your reports advance through the automated workflow, empathetic real-time updates will appear here."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) markRead.mutate(n.id);
              }}
              className={`p-5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer ${
                !n.is_read ? 'bg-teal-50/30 dark:bg-teal-950/20' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{n.title}</span>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  )}
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {n.message}
              </p>

              {n.issue_id && (
                <Link
                  to={`/issues/${n.issue_id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  View linked issue <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
