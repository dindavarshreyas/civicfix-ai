import { supabaseAdmin } from '../config/supabase.js';
import { assertValidStatusTransition } from '../utils/statusMachine.js';
import { calculatePriority, calculateSlaDueAt } from '../utils/scoring.js';
import { getSignedImageUrl } from './storageService.js';
import { notifyReportersForIssue } from './notificationService.js';
import { callAgentWithRetry } from '../ai/callAgentWithRetry.js';
import { notificationJsonSchema } from '../ai/schemas/notification.json.js';
import { notificationOutputSchema } from '../validation/aiSchemas.js';
import { buildNotificationPrompt } from '../ai/prompts/notificationPrompt.js';
import { getNotificationFallback } from '../ai/fallbacks.js';
import { SimulatedDepartmentAdapter } from '../workflow/SimulatedDepartmentAdapter.js';
import { HttpDepartmentAdapter } from '../workflow/HttpDepartmentAdapter.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const adapter = env.DEPARTMENT_API_URL
  ? new HttpDepartmentAdapter(env.DEPARTMENT_API_URL)
  : new SimulatedDepartmentAdapter();

/**
 * Reconciles status lazily upon reading an issue (solves free-tier container sleep).
 */
export async function reconcileIssueStatus(issue) {
  if (!issue || ['closed', 'rejected'].includes(issue.status)) {
    return issue;
  }
  try {
    const nextStatus = await adapter.fetchStatus(issue);
    if (nextStatus && nextStatus.status && nextStatus.status !== issue.status) {
      const updatePayload = {
        status: nextStatus.status,
      };
      if (nextStatus.status === 'resolved') {
        updatePayload.resolved_at = new Date().toISOString();
      }
      await supabaseAdmin.from('issues').update(updatePayload).eq('id', issue.id);

      await supabaseAdmin.from('issue_status_history').insert({
        issue_id: issue.id,
        from_status: issue.status,
        to_status: nextStatus.status,
        note: nextStatus.note || `Lazy reconciliation: progressed to ${nextStatus.status}`,
        actor_type: 'system',
        actor_id: null,
      });

      issue.status = nextStatus.status;
      if (nextStatus.status === 'resolved') {
        issue.resolved_at = updatePayload.resolved_at;
      }
    }
  } catch (err) {
    logger.debug({ error: err.message, issueId: issue?.id }, 'Lazy status reconciliation non-blocking check failed');
  }
  return issue;
}

/**
 * Lists public issues with filtering and safe projection.
 */
export async function listPublicIssues({
  category,
  status,
  priority,
  department_id,
  bbox,
  page = 1,
  pageSize = 20,
  search,
}) {
  let query = supabaseAdmin
    .from('issues')
    .select(`
      id,
      reference_no,
      category,
      title,
      summary,
      latitude,
      longitude,
      address_text,
      status,
      priority,
      priority_score,
      report_count,
      primary_image_path,
      sla_due_at,
      first_reported_at,
      last_reported_at,
      resolved_at,
      created_at,
      departments(id, code, name)
    `, { count: 'exact' });

  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);
  if (department_id) query = query.eq('department_id', department_id);

  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
    query = query
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%,reference_no.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('last_reported_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
      logger.warn({ error: error.message }, 'Issues table not found in database; returning empty set');
      return {
        issues: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
    logger.error({ error: error.message }, 'Failed to list public issues');
    throw error;
  }

  // Generate signed URLs for issues that have primary_image_path and reconcile statuses
  const issuesWithImages = await Promise.all(
    (data || []).map(async (issue) => {
      await reconcileIssueStatus(issue);
      let imageUrl = null;
      if (issue.primary_image_path) {
        imageUrl = await getSignedImageUrl(issue.primary_image_path, 300);
      }
      return {
        ...issue,
        imageUrl,
      };
    })
  );

  return {
    issues: issuesWithImages,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Gets public issue view by ID with timeline.
 */
export async function getPublicIssueById(issueId) {
  const { data: issue, error } = await supabaseAdmin
    .from('issues')
    .select(`
      id,
      reference_no,
      category,
      title,
      summary,
      latitude,
      longitude,
      address_text,
      status,
      priority,
      priority_score,
      report_count,
      primary_image_path,
      sla_due_at,
      first_reported_at,
      last_reported_at,
      resolved_at,
      created_at,
      departments(id, code, name)
    `)
    .eq('id', issueId)
    .single();

  if (error || !issue) {
    const notFound = new Error('Issue not found');
    notFound.statusCode = 404;
    throw notFound;
  }

  // Lazy reconciliation for container sleep
  await reconcileIssueStatus(issue);

  // Fetch public timeline
  const { data: timeline } = await supabaseAdmin
    .from('issue_status_history')
    .select('id, from_status, to_status, note, actor_type, created_at')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true });

  let imageUrl = null;
  if (issue.primary_image_path) {
    imageUrl = await getSignedImageUrl(issue.primary_image_path, 300);
  }

  return {
    ...issue,
    imageUrl,
    timeline: timeline || [],
  };
}

/**
 * Gets detailed issue view for authorized Officers and Admins.
 * Anonymizes citizens as "Citizen #1", "Citizen #2", etc.
 */
export async function getIssueDetailForOfficer(issueId, user) {
  const { data: issue, error } = await supabaseAdmin
    .from('issues')
    .select(`
      *,
      departments(id, code, name, contact_email)
    `)
    .eq('id', issueId)
    .single();

  if (error || !issue) {
    const notFound = new Error('Issue not found');
    notFound.statusCode = 404;
    throw notFound;
  }

  // Lazy reconciliation for container sleep
  await reconcileIssueStatus(issue);

  // Officer department scope check
  if (user.role === 'officer' && user.department_id && issue.department_id !== user.department_id) {
    const forbidden = new Error('You do not have permission to view issues outside your department');
    forbidden.statusCode = 403;
    throw forbidden;
  }

  // Fetch linked reports
  const { data: reports } = await supabaseAdmin
    .from('reports')
    .select('id, description, image_path, latitude, longitude, address_text, landmark, created_at, user_id')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true });

  // Anonymize reports
  const anonymizedReports = await Promise.all(
    (reports || []).map(async (r, idx) => {
      let imageUrl = null;
      if (r.image_path) {
        imageUrl = await getSignedImageUrl(r.image_path, 300);
      }
      return {
        id: r.id,
        reporterLabel: `Citizen #${idx + 1}`,
        description: r.description,
        address_text: r.address_text,
        landmark: r.landmark,
        imageUrl,
        created_at: r.created_at,
      };
    })
  );

  // Fetch status history
  const { data: timeline } = await supabaseAdmin
    .from('issue_status_history')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true });

  // Fetch overrides history
  const { data: overrides } = await supabaseAdmin
    .from('ai_overrides')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true });

  let primaryImageUrl = null;
  if (issue.primary_image_path) {
    primaryImageUrl = await getSignedImageUrl(issue.primary_image_path, 300);
  }

  return {
    ...issue,
    primaryImageUrl,
    reports: anonymizedReports,
    timeline: timeline || [],
    overrides: overrides || [],
  };
}

/**
 * Updates issue status by Officer or Admin with audit and notifications.
 */
export async function updateIssueStatus(issueId, { status: newStatus, note }, user) {
  const { data: issue, error: fetchErr } = await supabaseAdmin
    .from('issues')
    .select('*, departments(code, name, sla_hours)')
    .eq('id', issueId)
    .single();

  if (fetchErr || !issue) {
    const err = new Error('Issue not found');
    err.statusCode = 404;
    throw err;
  }

  // Officer department guard
  if (user.role === 'officer' && user.department_id && issue.department_id !== user.department_id) {
    const err = new Error('You may only update issues within your designated department');
    err.statusCode = 403;
    throw err;
  }

  // Validate state machine transition
  assertValidStatusTransition(issue.status, newStatus);

  const updatePayload = {
    status: newStatus,
  };

  if (newStatus === 'resolved') {
    updatePayload.resolved_at = new Date().toISOString();
  }

  const { data: updatedIssue, error: updateErr } = await supabaseAdmin
    .from('issues')
    .update(updatePayload)
    .eq('id', issueId)
    .select()
    .single();

  if (updateErr) {
    logger.error({ error: updateErr.message, issueId }, 'Failed to update issue status');
    throw updateErr;
  }

  // Insert status history row
  await supabaseAdmin.from('issue_status_history').insert({
    issue_id: issueId,
    from_status: issue.status,
    to_status: newStatus,
    note: note || `Status changed from ${issue.status} to ${newStatus}`,
    actor_type: user.role === 'admin' ? 'admin' : 'officer',
    actor_id: user.id,
  });

  // Run Notification Agent for all linked reporters
  const notifPrompt = buildNotificationPrompt({
    reference_no: issue.reference_no,
    category: issue.category,
    status: newStatus,
    officer_note: note,
    report_count: issue.report_count,
  });

  const notifResult = await callAgentWithRetry({
    agentName: 'notification',
    systemInstruction: notifPrompt.systemInstruction,
    userText: notifPrompt.userText,
    jsonSchema: notificationJsonSchema,
    zodSchema: notificationOutputSchema,
    fallbackFn: () => getNotificationFallback({
      reference_no: issue.reference_no,
      status: newStatus,
      report_count: issue.report_count,
    }),
    fallbackContext: {},
  });

  await notifyReportersForIssue({
    issueId,
    title: notifResult.data.title,
    message: notifResult.data.message,
    emailSubject: notifResult.data.email_subject,
    emailBody: notifResult.data.email_body,
  });

  return updatedIssue;
}

/**
 * Reopens an issue ("Still not fixed") by a citizen reporter.
 */
export async function reopenIssue(issueId, note, user) {
  // Verify user is a linked reporter
  const { data: report, error: repErr } = await supabaseAdmin
    .from('reports')
    .select('id')
    .eq('issue_id', issueId)
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (repErr || !report) {
    const err = new Error('Only a reporter who submitted this issue can confirm it is not fixed');
    err.statusCode = 403;
    throw err;
  }

  const { data: issue, error: fetchErr } = await supabaseAdmin
    .from('issues')
    .select('*')
    .eq('id', issueId)
    .single();

  if (fetchErr || !issue) {
    const err = new Error('Issue not found');
    err.statusCode = 404;
    throw err;
  }

  if (issue.status !== 'resolved') {
    const err = new Error('Only resolved issues can be reopened');
    err.statusCode = 400;
    throw err;
  }

  const { data: updated, error: updErr } = await supabaseAdmin
    .from('issues')
    .update({
      status: 'reopened',
      resolved_at: null,
    })
    .eq('id', issueId)
    .select()
    .single();

  if (updErr) throw updErr;

  // Record history
  await supabaseAdmin.from('issue_status_history').insert({
    issue_id: issueId,
    from_status: 'resolved',
    to_status: 'reopened',
    note: note || 'Citizen confirmed issue is still not fixed',
    actor_type: 'citizen',
    actor_id: user.id,
  });

  // Notify reporters
  await notifyReportersForIssue({
    issueId,
    title: 'Issue Reopened',
    message: `Issue ${issue.reference_no} was reopened by citizen inspection. Municipal crew has been re-alerted.`,
    emailSubject: `[CivicMind] Reopened: ${issue.reference_no}`,
    emailBody: `Your report ${issue.reference_no} has been reopened as still pending fix. It is now re-queued for inspection.`,
  });

  return updated;
}

/**
 * Officer or Admin overrides AI decision with audit trail and downstream adjustments.
 */
export async function overrideAiDecision(issueId, { field, newValue, reason }, user) {
  const { data: issue, error: fetchErr } = await supabaseAdmin
    .from('issues')
    .select('*, departments(*)')
    .eq('id', issueId)
    .single();

  if (fetchErr || !issue) {
    const err = new Error('Issue not found');
    err.statusCode = 404;
    throw err;
  }

  const oldValue = String(issue[field] || '');
  const updatePayload = {
    [field]: newValue,
    ai_overridden: true,
  };

  // If priority changed, recalculate SLA due at
  if (field === 'priority') {
    const deptSla = issue.departments?.sla_hours || { critical: 24, high: 72, medium: 168, low: 336 };
    const slaHours = deptSla[newValue] || 72;
    updatePayload.sla_due_at = calculateSlaDueAt(slaHours);
    updatePayload.priority_reasoning = `Officer manual override: ${reason}`;
  }

  const { data: updatedIssue, error: updErr } = await supabaseAdmin
    .from('issues')
    .update(updatePayload)
    .eq('id', issueId)
    .select()
    .single();

  if (updErr) throw updErr;

  // Insert audit record
  await supabaseAdmin.from('ai_overrides').insert({
    issue_id: issueId,
    officer_id: user.id,
    field,
    old_value: oldValue,
    new_value: newValue,
    reason,
  });

  // Insert timeline note
  await supabaseAdmin.from('issue_status_history').insert({
    issue_id: issueId,
    from_status: issue.status,
    to_status: issue.status,
    note: `Officer override: changed ${field} from '${oldValue}' to '${newValue}'. Reason: ${reason}`,
    actor_type: user.role === 'admin' ? 'admin' : 'officer',
    actor_id: user.id,
  });

  return updatedIssue;
}
