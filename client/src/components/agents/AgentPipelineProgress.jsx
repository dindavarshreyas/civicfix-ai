import React from 'react';
import {
  Eye,
  GitBranch,
  CopyCheck,
  Flame,
  FileText,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

const AGENT_CONFIGS = [
  { key: 'vision_intake', name: 'Vision & Intake Agent', icon: Eye, description: 'Analyzing evidence & cues' },
  { key: 'routing', name: 'Routing Agent', icon: GitBranch, description: 'Matching responsible department' },
  { key: 'duplicate', name: 'Duplicate Merge Agent', icon: CopyCheck, description: 'Checking geospatial proximity' },
  { key: 'priority', name: 'Priority & Severity Agent', icon: Flame, description: 'Assessing danger & urgency' },
  { key: 'complaint', name: 'Complaint Drafting Agent', icon: FileText, description: 'Drafting structured formal record' },
  { key: 'notification', name: 'Notification Agent', icon: Bell, description: 'Personalizing citizen updates' },
];

export function AgentPipelineProgress({ steps = [], state, errorMessage }) {
  const getStepStatus = (agentKey) => {
    const run = steps.find((s) => s.agent_name === agentKey);
    if (run) {
      return {
        status: run.status,
        reasoning: run.reasoning,
        model: run.model,
        latencyMs: run.latency_ms,
      };
    }

    if (state === 'failed') return { status: 'failed' };
    return { status: 'pending' };
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Autonomous Agent Pipeline</h3>
            <p className="text-xs text-slate-500">
              {state === 'processed' ? 'Multi-agent orchestration completed' : 'Agents actively reasoning in real-time...'}
            </p>
          </div>
        </div>

        <div>
          {state === 'processing' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" /> Live Processing
            </span>
          )}
          {state === 'processed' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Complete
            </span>
          )}
          {state === 'failed' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Pipeline Failed
            </span>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-800 text-sm border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Stepper Steps */}
      <div className="space-y-4" aria-live="polite">
        {AGENT_CONFIGS.map((agent, index) => {
          const stepInfo = getStepStatus(agent.key);
          const isDone = stepInfo.status === 'succeeded' || stepInfo.status === 'fallback';
          const isRunning = !isDone && state === 'processing' && (index === 0 || getStepStatus(AGENT_CONFIGS[index - 1].key).status === 'succeeded');
          const Icon = agent.icon;

          return (
            <div
              key={agent.key}
              className={`p-4 rounded-xl border transition-all ${
                isDone
                  ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  : isRunning
                  ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-300 dark:border-teal-700 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : isRunning
                        ? 'bg-teal-600 text-white animate-bounce'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {agent.name}
                      {stepInfo.status === 'fallback' && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Fallback
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{agent.description}</p>
                    {stepInfo.reasoning && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 font-medium bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        "{stepInfo.reasoning}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isRunning ? (
                    <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                  )}
                  {stepInfo.latencyMs !== undefined && stepInfo.latencyMs > 0 && (
                    <span className="block text-[10px] text-slate-400 font-mono mt-1">{stepInfo.latencyMs}ms</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
