import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Sparkles,
  MapPin,
  CheckCircle2,
  Users,
  Eye,
  GitBranch,
  CopyCheck,
  Flame,
  FileText,
  Clock,
} from 'lucide-react';

export function Landing() {
  const { data: stats } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: () => api.get('/issues', { pageSize: 1 }),
  });

  return (
    <div className="space-y-16 py-6 sm:py-12">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Autonomous Municipal Coordination</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Civic issues resolved in <span className="text-teal-600">one minute</span>, not weeks.
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Snap a photo or type a sentence. A pipeline of cooperating AI agents classifies, geolocates, deduplicates, prioritizes, and drafts your formal complaint autonomously.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/report/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-md shadow-teal-600/20"
          >
            Report a Problem Now
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/map"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
          >
            Explore Public Map
          </Link>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-slate-200 dark:border-slate-800 mt-12 text-left">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-2xl font-bold text-teal-600">60s</span>
            <p className="text-xs text-slate-500 mt-0.5">Average Citizen Filing Time</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-2xl font-bold text-indigo-600">7-Agent</span>
            <p className="text-xs text-slate-500 mt-0.5">Autonomous Pipeline</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-2xl font-bold text-purple-600">100%</span>
            <p className="text-xs text-slate-500 mt-0.5">Auditable Agent Trace</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-2xl font-bold text-emerald-600">Zero</span>
            <p className="text-xs text-slate-500 mt-0.5">Manual Bureaucracy</p>
          </div>
        </div>
      </section>

      {/* How the Multi-Agent Pipeline Works */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            How CivicMind Agents Cooperate
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A citizen only provides raw evidence. The autonomous multi-agent mesh handles every decision that follows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Vision & Intake Agent</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Analyzes photos and citizen text, evaluates infrastructure damage, classifies categories (garbage, roads, streetlights, water, drains), and detects hazard cues.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <CopyCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Geospatial Duplicate Merge</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Finds open issues within spatial radius. Rather than flooding officers with duplicate tickets, it merges reports, escalates priority, and notifies all reporters.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">3. Complaint & SLA Engine</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Drafts structured legal complaints for the responsible municipal department, computes SLA timelines, and drives automated tracking to resolution.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
