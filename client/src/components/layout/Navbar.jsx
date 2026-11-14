import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  Compass,
  PlusCircle,
  ClipboardList,
  Map,
  ShieldCheck,
  BarChart3,
  Cpu,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';

export function Navbar() {
  const { user, profile, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">CivicMind</span>
              <span className="hidden sm:inline-block ml-1.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                Agentic AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/map"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/map')
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Map className="w-4 h-4" /> Map
              </span>
            </Link>

            {user && (
              <>
                <Link
                  to="/report/new"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/report/new')
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold">
                    <PlusCircle className="w-4 h-4" /> Report Issue
                  </span>
                </Link>

                <Link
                  to="/my-reports"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/my-reports')
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4" /> My Reports
                  </span>
                </Link>
              </>
            )}

            {/* Officer Links */}
            {(role === 'officer' || role === 'admin') && (
              <Link
                to="/officer"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/officer')
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Officer Queue
                </span>
              </Link>
            )}

            {/* Admin Links */}
            {role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin')
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4" /> Admin Analytics
                  </span>
                </Link>

                <Link
                  to="/admin/agent-trace"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin/agent-trace')
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" /> Agent Trace
                  </span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NotificationBell />
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold leading-none">{profile?.full_name || 'User'}</p>
                    <span className="text-[10px] text-slate-400 capitalize">{role}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-teal-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-3.5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <Link
              to="/map"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200"
            >
              Public Issue Map
            </Link>
            {user && (
              <>
                <Link
                  to="/report/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-teal-600"
                >
                  + Report New Problem
                </Link>
                <Link
                  to="/my-reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200"
                >
                  My Reports Timeline
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200"
                >
                  Notifications
                </Link>
              </>
            )}
            {(role === 'officer' || role === 'admin') && (
              <Link
                to="/officer"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600"
              >
                Officer Queue
              </Link>
            )}
            {role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-purple-600"
                >
                  Admin Analytics
                </Link>
                <Link
                  to="/admin/departments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200"
                >
                  Departments
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200"
                >
                  Users
                </Link>
                <Link
                  to="/admin/agent-trace"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-200"
                >
                  Agent Trace
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
