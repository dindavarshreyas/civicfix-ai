import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Checking authentication session..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function RoleGate({ roles = [], children, fallback = null }) {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner size="sm" />;
  }

  if (!roles.includes(role)) {
    return (
      fallback || (
        <div className="p-8 text-center bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
          <h3 className="text-base font-semibold text-red-800 dark:text-red-300">Access Restricted</h3>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            You do not have the necessary permissions ({roles.join(', ')}) to view this section.
          </p>
        </div>
      )
    );
  }

  return children;
}
