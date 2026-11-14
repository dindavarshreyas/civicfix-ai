import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase.js';
import { SimulatedDepartmentAdapter } from './SimulatedDepartmentAdapter.js';
import { HttpDepartmentAdapter } from './HttpDepartmentAdapter.js';
import { runNotificationAgent } from '../agents/notificationAgent.js';
import { notifyReportersForIssue } from '../services/notificationService.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const adapter = env.DEPARTMENT_API_URL
  ? new HttpDepartmentAdapter(env.DEPARTMENT_API_URL)
  : new SimulatedDepartmentAdapter();

let isTickRunning = false;

/**
 * Executes a single tick of the simulated workflow engine.
 * Scans active issues and advances statuses if eligible.
 */
export async function triggerWorkflowTick() {
  if (isTickRunning) {
    logger.debug('Workflow tick skipped: previous tick still active');
    return { skipped: true, reason: 'Already running' };
  }

  isTickRunning = true;
  let advancedCount = 0;

  try {
    // Fetch non-terminal issues
    const { data: issues, error } = await supabaseAdmin
      .from('issues')
      .select('*, departments(code, name, sla_hours)')
      .not('status', 'in', '("closed","rejected")')
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      logger.error({ error: error.message }, 'Failed to fetch issues for workflow tick');
      return { advancedCount: 0, error: error.message };
    }

    if (!issues || issues.length === 0) {
      return { advancedCount: 0, checked: 0 };
    }

    for (const issue of issues) {
      try {
        const nextStatus = await adapter.fetchStatus(issue);
        if (nextStatus && nextStatus.status && nextStatus.status !== issue.status) {
          logger.info(
            { issueId: issue.id, ref: issue.reference_no, from: issue.status, to: nextStatus.status },
            'Workflow advancing issue status'
          );

          const updatePayload = {
            status: nextStatus.status,
          };

          if (nextStatus.status === 'resolved') {
            updatePayload.resolved_at = new Date().toISOString();
          }

          // Update issue status
          await supabaseAdmin
            .from('issues')
            .update(updatePayload)
            .eq('id', issue.id);

          // Add timeline entry
          await supabaseAdmin.from('issue_status_history').insert({
            issue_id: issue.id,
            from_status: issue.status,
            to_status: nextStatus.status,
            note: nextStatus.note || `Status progressed to ${nextStatus.status}`,
            actor_type: 'system',
            actor_id: null,
          });

          // Record agent run
          await supabaseAdmin.from('agent_runs').insert({
            issue_id: issue.id,
            pipeline_run_id: issue.id,
            step_order: 99,
            agent_name: 'status',
            status: 'succeeded',
            inputSummary: { fromStatus: issue.status, targetStatus: nextStatus.status },
            output: nextStatus,
            reasoning: nextStatus.note,
            model: 'simulated-workflow-engine',
            latencyMs: 5,
          });

          // Run notification agent and notify reporters
          const notifResult = await runNotificationAgent({
            reference_no: issue.reference_no,
            category: issue.category,
            status: nextStatus.status,
            officer_note: nextStatus.note,
            report_count: issue.report_count,
          });

          await notifyReportersForIssue({
            issueId: issue.id,
            title: notifResult.data.title,
            message: notifResult.data.message,
            emailSubject: notifResult.data.email_subject,
            emailBody: notifResult.data.email_body,
          });

          advancedCount++;
        }
      } catch (err) {
        logger.error({ error: err.message, issueId: issue.id }, 'Error advancing issue in workflow tick');
      }
    }

    return { advancedCount, checked: issues.length };
  } finally {
    isTickRunning = false;
  }
}

/**
 * Initializes the node-cron scheduler.
 */
export function startWorkflowScheduler() {
  if (!env.WORKFLOW_ENABLED) {
    logger.info('Simulated workflow scheduler is disabled via WORKFLOW_ENABLED=false');
    return null;
  }

  const cronPattern = env.WORKFLOW_TICK_CRON || '* * * * *';
  logger.info({ cronPattern }, 'Starting workflow cron scheduler');

  const task = cron.schedule(cronPattern, async () => {
    try {
      await triggerWorkflowTick();
    } catch (err) {
      logger.error({ error: err.message }, 'Workflow scheduler tick failed');
    }
  });

  return task;
}
