import React from 'react';
import { AlertTriangle, ShieldAlert, EyeOff } from 'lucide-react';

export function EmergencyAdvisoryBanner() {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-200">
          <p className="font-semibold mb-0.5">Not for Immediate Emergencies</p>
          <p className="text-xs opacity-90">
            Do not use CivicMind for life-threatening emergencies. For immediate fire, medical, or crime emergencies, call your local emergency number (112 / 911) immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

export function HazardAdvisoryBanner({ category }) {
  const hazardMessages = {
    streetlight: 'Keep a safe distance from exposed or dangling wires. Do not touch lighting poles in wet conditions.',
    water_leakage: 'Be cautious of slippery asphalt and potential road sub-base collapse under pressurized water.',
    drainage: 'Do not enter flooded gutters or submerged manholes. Water depth may conceal open drain pits.',
    road_damage: 'Two-wheelers and cyclists should exercise extreme caution around deep road craters and uneven road edges.',
  };

  const message = hazardMessages[category];
  if (!message) return null;

  return (
    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-4 my-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="text-sm text-red-800 dark:text-red-200">
          <p className="font-semibold mb-0.5">Active Safety Hazard Advisory</p>
          <p className="text-xs opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function PrivacyNoticeBanner() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 my-4">
      <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
        <EyeOff className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-700 dark:text-slate-300">Privacy Notice:</strong> Photos may contain faces or number plates. Please avoid capturing people. Stored images are encrypted in private storage and accessible only to you and assigned municipal officers.
        </p>
      </div>
    </div>
  );
}
