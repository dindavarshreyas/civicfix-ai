import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute, RoleGate } from './components/layout/ProtectedRoute';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { MapPage } from './pages/MapPage';
import { IssuePublic } from './pages/IssuePublic';
import { ReportNew } from './pages/ReportNew';
import { ReportProcessing } from './pages/ReportProcessing';
import { MyReports } from './pages/MyReports';
import { ReportDetail } from './pages/ReportDetail';
import { Notifications } from './pages/Notifications';
import { OfficerQueue } from './pages/OfficerQueue';
import { OfficerIssue } from './pages/OfficerIssue';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminDepartments } from './pages/AdminDepartments';
import { AdminUsers } from './pages/AdminUsers';
import { AgentTrace } from './pages/AgentTrace';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/issues/:issueId" element={<IssuePublic />} />

          {/* Citizen Protected Routes */}
          <Route
            path="/report/new"
            element={
              <ProtectedRoute>
                <ReportNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/processing/:reportId"
            element={
              <ProtectedRoute>
                <ReportProcessing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute>
                <MyReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:reportId"
            element={
              <ProtectedRoute>
                <ReportDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Officer & Admin Routes */}
          <Route
            path="/officer"
            element={
              <ProtectedRoute>
                <RoleGate roles={['officer', 'admin']}>
                  <OfficerQueue />
                </RoleGate>
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/issues/:issueId"
            element={
              <ProtectedRoute>
                <RoleGate roles={['officer', 'admin']}>
                  <OfficerIssue />
                </RoleGate>
              </ProtectedRoute>
            }
          />

          {/* Admin Exclusive Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleGate roles={['admin']}>
                  <AdminDashboard />
                </RoleGate>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute>
                <RoleGate roles={['admin']}>
                  <AdminDepartments />
                </RoleGate>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <RoleGate roles={['admin']}>
                  <AdminUsers />
                </RoleGate>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/agent-trace"
            element={
              <ProtectedRoute>
                <RoleGate roles={['admin', 'officer']}>
                  <AgentTrace />
                </RoleGate>
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
