import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { runVisionIntakeAgent } from './visionIntakeAgent.js';
import { runRoutingAgent } from './routingAgent.js';
import { runDuplicateAgent } from './duplicateAgent.js';
import { runPriorityAgent } from './priorityAgent.js';
import { runComplaintAgent } from './complaintAgent.js';
import { runNotificationAgent } from './notificationAgent.js';
import { generateReferenceNumber } from '../utils/referenceNo.js';
import { calculateSlaDueAt } from '../utils/scoring.js';
import { notifyReportersForIssue } from '../services/notificationService.js';
import { inMemoryReports, inMemoryAgentRuns } from '../services/reportService.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// In-memory queue with concurrency limit of 3
const queue = [];
let activeWorkers = 0;
const MAX_CONCURRENCY = env.AI_CONCURRENCY || 3;

// Temporary cache for uploaded image data while processing
export const imageBufferCache = new Map();

/**
 * Enqueues a reportId for asynchronous multi-agent orchestration.
 */
export function enqueueReportProcessing(reportId) {
  queue.push(reportId);
  processQueue();
}

async function processQueue() {
  if (activeWorkers >= MAX_CONCURRENCY || queue.length === 0) {
    return;
  }

  activeWorkers++;
  const reportId = queue.shift();

  try {
    await runOrchestratorPipeline(reportId);
  } catch (err) {
    logger.error({ error: err.message, reportId }, 'Orchestration pipeline encountered uncaught error');
  } finally {
    activeWorkers--;
    setImmediate(processQueue);
  }
}

/**
 * Startup recovery job: finds reports stuck in 'processing' for > 5 minutes and re-queues them.
 */
export async function recoverStuckReports() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: stuckReports, error } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('state', 'processing')
      .lte('updated_at', fiveMinutesAgo);

    if (!error && stuckReports && stuckReports.length > 0) {
      logger.info({ count: stuckReports.length }, 'Recovering stuck reports');
      for (const rep of stuckReports) {
        enqueueReportProcessing(rep.id);
      }
    }
  } catch (err) {
    logger.warn({ error: err.message }, 'Report recovery job completed with notice');
  }
}

/**
 * Main Multi-Agent Orchestrator Pipeline
 */
export async function runOrchestratorPipeline(reportId) {
  const pipelineRunId = crypto.randomUUID();
  let stepOrder = 0;

  // Helper to record agent run in agent_runs table
  async function recordAgentRun({
    agentName,
    status = 'succeeded',
    inputSummary = {},
    output = {},
    reasoning = '',
    model = 'gemini-2.5-flash',
    latencyMs = 0,
    errorMessage = null,
    issueId = null,
  }) {
    // Always record to in-memory store for instant UI polling
    const memRuns = inMemoryAgentRuns.get(reportId) || [];
    memRuns.push({
      step_order: stepOrder,
      agent_name: agentName,
      status,
      reasoning,
      model,
      latency_ms: latencyMs,
      created_at: new Date().toISOString(),
    });
    inMemoryAgentRuns.set(reportId, memRuns);

    try {
      await supabaseAdmin.from('agent_runs').insert({
        report_id: reportId,
        issue_id: issueId,
        pipeline_run_id: pipelineRunId,
        step_order: stepOrder++,
        agent_name: agentName,
        status,
        input_summary: inputSummary,
        output,
        reasoning,
        model,
        latency_ms: latencyMs,
        error_message: errorMessage,
      });
    } catch (err) {
      stepOrder++;
      logger.warn({ err: err.message, agentName }, 'Notice recording agent_run to database');
    }
  }

  try {
    // 1. Fetch Report Record (DB or in-memory fallback)
    let { data: report, error: repErr } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (repErr || !report) {
      report = inMemoryReports.get(reportId);
    }

    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    // Set state to processing
    if (inMemoryReports.has(reportId)) {
      const rep = inMemoryReports.get(reportId);
      rep.state = 'processing';
      inMemoryReports.set(reportId, rep);
    }

    try {
      await supabaseAdmin
        .from('reports')
        .update({ state: 'processing' })
        .eq('id', reportId);
    } catch {}

    // Step 0: Plan recording
    const plan = [
      { step: 1, agent: 'vision_intake', goal: 'Classify evidence, extract cues and judge validity' },
      { step: 2, agent: 'routing', goal: 'Determine responsible municipal department' },
      { step: 3, agent: 'duplicate', goal: 'Check geospatial candidates and evaluate merge' },
      { step: 4, agent: 'priority', goal: 'Score severity across four safety and impact axes' },
      { step: 5, agent: 'complaint', goal: 'Draft formal structured complaint or merge addendum' },
      { step: 6, agent: 'status_tracking', goal: 'Initialize tracking schedule and workflow' },
      { step: 7, agent: 'notification', goal: 'Generate citizen notifications and dispatch updates' },
    ];

    await recordAgentRun({
      agentName: 'orchestrator',
      status: 'succeeded',
      inputSummary: { reportId, hasImage: !!report.image_path, hasText: !!report.description },
      output: { plan },
      reasoning: 'Multi-agent orchestration plan initialized with 7 execution phases.',
      model: 'orchestrator-deterministic',
      latencyMs: 5,
    });

    // Retrieve cached image data if present
    const imagePayload = imageBufferCache.get(reportId) || null;

    // STEP 1: Vision & Intake Agent
    const intakeContext = {
      latitude: report.latitude,
      longitude: report.longitude,
      address_text: report.address_text,
      landmark: report.landmark,
      description: report.description,
    };

    const intakeResult = await runVisionIntakeAgent(intakeContext, imagePayload);

    await recordAgentRun({
      agentName: 'vision_intake',
      status: intakeResult.status,
      inputSummary: {
        description: report.description?.slice(0, 100),
        hasImage: !!report.image_path,
        lat: report.latitude,
        lng: report.longitude,
      },
      output: intakeResult.data,
      reasoning: intakeResult.reasoning,
      model: intakeResult.model,
      latencyMs: intakeResult.latencyMs,
      errorMessage: intakeResult.error_message,
    });

    // Update report with AI analysis
    await supabaseAdmin
      .from('reports')
      .update({ ai_analysis: intakeResult.data })
      .eq('id', reportId);

    // Branching: Check if valid civic issue
    if (intakeResult.data.is_valid_civic_issue === false) {
      await supabaseAdmin
        .from('reports')
        .update({
          state: 'processed',
          error_message: intakeResult.data.invalid_reason || 'Report was judged not to be a civic issue.',
        })
        .eq('id', reportId);

      // Notify citizen politely
      await supabaseAdmin.from('notifications').insert({
        user_id: report.user_id,
        report_id: reportId,
        channel: 'in_app',
        title: 'Report Update',
        message: intakeResult.data.invalid_reason || 'Your submission could not be processed as an active civic grievance.',
        is_read: false,
        delivered_at: new Date().toISOString(),
      });

      imageBufferCache.delete(reportId);
      return;
    }

    // Branching: Low confidence fallback to general triage
    if (intakeResult.data.confidence < (env.AI_CONFIDENCE_THRESHOLD || 0.55)) {
      intakeResult.data.category = 'other';
      intakeResult.reasoning += ' [Low confidence: routed to general civic triage]';
    }

    // STEP 2: Department Routing Agent
    const { data: dbDepartments } = await supabaseAdmin
      .from('departments')
      .select('*')
      .eq('is_active', true);

    const activeDepartments = (dbDepartments && dbDepartments.length > 0)
      ? dbDepartments
      : [
          { id: '00000000-0000-0000-0000-000000000001', code: 'SWM', name: 'Solid Waste Management', handles_categories: ['garbage'], sla_hours: { critical: 24, high: 72, medium: 168, low: 336 } },
          { id: '00000000-0000-0000-0000-000000000002', code: 'RPW', name: 'Roads & Public Works', handles_categories: ['road_damage'], sla_hours: { critical: 24, high: 72, medium: 168, low: 336 } },
          { id: '00000000-0000-0000-0000-000000000003', code: 'ESL', name: 'Electrical & Street Lighting', handles_categories: ['streetlight'], sla_hours: { critical: 24, high: 72, medium: 168, low: 336 } },
          { id: '00000000-0000-0000-0000-000000000004', code: 'WSB', name: 'Water Supply & Sewerage Board', handles_categories: ['water_leakage'], sla_hours: { critical: 24, high: 72, medium: 168, low: 336 } },
          { id: '00000000-0000-0000-0000-000000000005', code: 'DSW', name: 'Drainage & Storm Water', handles_categories: ['drainage'], sla_hours: { critical: 24, high: 72, medium: 168, low: 336 } },
          { id: '00000000-0000-0000-0000-000000000006', code: 'GGC', name: 'General Grievance Cell', handles_categories: ['other'], sla_hours: { critical: 24, high: 72, medium: 168, low: 336 } },
        ];

    const routingResult = await runRoutingAgent({
      intake: intakeResult.data,
      departments: activeDepartments,
    });

    await recordAgentRun({
      agentName: 'routing',
      status: routingResult.status,
      inputSummary: { category: intakeResult.data.category, title: intakeResult.data.title },
      output: routingResult.data,
      reasoning: routingResult.reasoning,
      model: routingResult.model,
      latencyMs: routingResult.latencyMs,
      errorMessage: routingResult.error_message,
    });

    // STEP 3: Duplicate Detection & Merge Agent
    const duplicateResult = await runDuplicateAgent({
      newReport: report,
      intake: intakeResult.data,
    });

    await recordAgentRun({
      agentName: 'duplicate',
      status: duplicateResult.status,
      inputSummary: {
        category: intakeResult.data.category,
        lat: report.latitude,
        lng: report.longitude,
        candidateCount: (duplicateResult.candidates || []).length,
      },
      output: duplicateResult.data,
      reasoning: duplicateResult.reasoning,
      model: duplicateResult.model,
      latencyMs: duplicateResult.latencyMs,
      errorMessage: duplicateResult.error_message,
    });

    const isDuplicate = duplicateResult.data.decision === 'merge';

    let canonicalIssue = null;
    let finalReportCount = 1;

    if (isDuplicate && duplicateResult.matchedCandidate) {
      // ----------------- MERGE FLOW -----------------
      canonicalIssue = duplicateResult.matchedCandidate;
      finalReportCount = (canonicalIssue.report_count || 1) + 1;

      // STEP 4 (Merge): Escalated Priority Agent
      const priorityResult = await runPriorityAgent({
        intake: intakeResult.data,
        location: {
          latitude: report.latitude,
          longitude: report.longitude,
          address_text: report.address_text,
          landmark: report.landmark,
        },
        report_count: finalReportCount,
      });

      const { score, level, defaultSlaHours, factors } = priorityResult.calculated;

      await recordAgentRun({
        agentName: 'priority',
        status: priorityResult.status,
        inputSummary: { category: intakeResult.data.category, report_count: finalReportCount },
        output: { score, level, factors, notes: priorityResult.data.factor_notes },
        reasoning: `${priorityResult.reasoning} Escalated with corroboration bonus for ${finalReportCount} reports.`,
        model: priorityResult.model,
        latencyMs: priorityResult.latencyMs,
        errorMessage: priorityResult.error_message,
        issueId: canonicalIssue.id,
      });

      // STEP 5 (Merge): Draft Addendum Complaint
      const complaintResult = await runComplaintAgent({
        intake: intakeResult.data,
        routing: routingResult.data,
        priority: { score, level, defaultSlaHours },
        location: {
          latitude: report.latitude,
          longitude: report.longitude,
          address_text: report.address_text,
          landmark: report.landmark,
        },
        mode: 'addendum',
        report_count: finalReportCount,
        reference_no: canonicalIssue.reference_no,
      });

      await recordAgentRun({
        agentName: 'complaint',
        status: complaintResult.status,
        inputSummary: { mode: 'addendum', referenceNo: canonicalIssue.reference_no },
        output: complaintResult.data,
        reasoning: complaintResult.reasoning,
        model: complaintResult.model,
        latencyMs: complaintResult.latencyMs,
        errorMessage: complaintResult.error_message,
        issueId: canonicalIssue.id,
      });

      // Update Canonical Issue in DB
      const existingComplaint = canonicalIssue.complaint || {};
      const addenda = existingComplaint.addenda || [];
      addenda.push({
        reported_at: new Date().toISOString(),
        body: complaintResult.data.body,
        requested_action: complaintResult.data.requested_action,
      });

      const updatedSummary = duplicateResult.data.merged_summary_update
        ? `${canonicalIssue.summary} ${duplicateResult.data.merged_summary_update}`.slice(0, 1000)
        : canonicalIssue.summary;

      await supabaseAdmin
        .from('issues')
        .update({
          report_count: finalReportCount,
          last_reported_at: new Date().toISOString(),
          priority: level,
          priority_score: score,
          priority_reasoning: `Escalated to score ${score} (${level}) based on ${finalReportCount} linked citizen reports.`,
          severity_factors: factors,
          summary: updatedSummary,
          complaint: {
            ...existingComplaint,
            addenda,
          },
        })
        .eq('id', canonicalIssue.id);

      // Link report to canonical issue
      if (inMemoryReports.has(reportId)) {
        const rep = inMemoryReports.get(reportId);
        rep.issue_id = canonicalIssue.id;
        rep.is_duplicate = true;
        rep.state = 'processed';
        rep.issues = canonicalIssue;
        inMemoryReports.set(reportId, rep);
      }

      try {
        await supabaseAdmin
          .from('reports')
          .update({
            issue_id: canonicalIssue.id,
            is_duplicate: true,
            state: 'processed',
          })
          .eq('id', reportId);
      } catch {}

      // Insert merge history entry
      await supabaseAdmin.from('issue_status_history').insert({
        issue_id: canonicalIssue.id,
        from_status: canonicalIssue.status,
        to_status: canonicalIssue.status,
        note: `Merged duplicate report #${finalReportCount} from citizen. Priority escalated to ${level} (score: ${score}).`,
        actor_type: 'agent',
        actor_id: null,
      });

      // Notify all linked reporters of the update and corroboration
      await notifyReportersForIssue({
        issueId: canonicalIssue.id,
        title: 'Report Corroborated',
        message: `Your report was merged with ${canonicalIssue.reference_no} (${finalReportCount} neighbours also reported this). Priority has been escalated.`,
        emailSubject: `[CivicMind] Update: Report Merged with ${canonicalIssue.reference_no}`,
        emailBody: `Thank you for reporting. Your report has been merged with verified issue ${canonicalIssue.reference_no}. A total of ${finalReportCount} citizens have now reported this problem, raising its priority to ${level.toUpperCase()}.`,
      });
    } else {
      // ----------------- NEW ISSUE FLOW -----------------
      finalReportCount = 1;

      // STEP 4 (New): Priority Agent
      const priorityResult = await runPriorityAgent({
        intake: intakeResult.data,
        location: {
          latitude: report.latitude,
          longitude: report.longitude,
          address_text: report.address_text,
          landmark: report.landmark,
        },
        report_count: 1,
      });

      const { score, level, defaultSlaHours, factors } = priorityResult.calculated;

      await recordAgentRun({
        agentName: 'priority',
        status: priorityResult.status,
        inputSummary: { category: intakeResult.data.category, report_count: 1 },
        output: { score, level, factors, notes: priorityResult.data.factor_notes },
        reasoning: priorityResult.reasoning,
        model: priorityResult.model,
        latencyMs: priorityResult.latencyMs,
        errorMessage: priorityResult.error_message,
      });

      const referenceNo = await generateReferenceNumber();
      const slaDueAt = calculateSlaDueAt(defaultSlaHours);

      // STEP 5 (New): Complaint Drafting Agent
      const complaintResult = await runComplaintAgent({
        intake: intakeResult.data,
        routing: routingResult.data,
        priority: { score, level, defaultSlaHours },
        location: {
          latitude: report.latitude,
          longitude: report.longitude,
          address_text: report.address_text,
          landmark: report.landmark,
        },
        mode: 'full',
        report_count: 1,
        reference_no: referenceNo,
      });

      await recordAgentRun({
        agentName: 'complaint',
        status: complaintResult.status,
        inputSummary: { mode: 'full', referenceNo },
        output: complaintResult.data,
        reasoning: complaintResult.reasoning,
        model: complaintResult.model,
        latencyMs: complaintResult.latencyMs,
        errorMessage: complaintResult.error_message,
      });

      // Insert New Canonical Issue
      let { data: newIssue, error: issueErr } = await supabaseAdmin
        .from('issues')
        .insert({
          reference_no: referenceNo,
          category: intakeResult.data.category,
          title: intakeResult.data.title,
          summary: intakeResult.data.summary,
          latitude: report.latitude,
          longitude: report.longitude,
          address_text: report.address_text,
          department_id: routingResult.data.department_id,
          status: 'submitted',
          priority: level,
          priority_score: score,
          priority_reasoning: priorityResult.reasoning,
          severity_factors: factors,
          report_count: 1,
          primary_image_path: report.image_path,
          complaint: complaintResult.data,
          sla_due_at: slaDueAt,
        })
        .select()
        .single();

      if (issueErr || !newIssue) {
        logger.warn({ referenceNo, error: issueErr?.message }, 'Issues table insert notice; using in-memory issue');
        canonicalIssue = {
          id: crypto.randomUUID(),
          reference_no: referenceNo,
          category: intakeResult.data.category,
          title: intakeResult.data.title,
          summary: intakeResult.data.summary,
          latitude: report.latitude,
          longitude: report.longitude,
          address_text: report.address_text,
          status: 'submitted',
          priority: level,
          priority_score: score,
          report_count: 1,
          complaint: complaintResult.data,
          sla_due_at: slaDueAt,
          created_at: new Date().toISOString(),
        };
      } else {
        canonicalIssue = newIssue;
      }

      // Link report to new canonical issue
      if (inMemoryReports.has(reportId)) {
        const rep = inMemoryReports.get(reportId);
        rep.issue_id = canonicalIssue.id;
        rep.is_duplicate = false;
        rep.state = 'processed';
        rep.issues = canonicalIssue;
        inMemoryReports.set(reportId, rep);
      }

      try {
        await supabaseAdmin
          .from('reports')
          .update({
            issue_id: canonicalIssue.id,
            is_duplicate: false,
            state: 'processed',
          })
          .eq('id', reportId);
      } catch {}

      // Initial status timeline entry
      await supabaseAdmin.from('issue_status_history').insert({
        issue_id: canonicalIssue.id,
        from_status: null,
        to_status: 'submitted',
        note: `Issue filed via automated multi-agent pipeline. Routed to ${routingResult.data.department_code}.`,
        actor_type: 'agent',
        actor_id: null,
      });

      // STEP 6: Notification Agent
      const notifPrompt = {
        reference_no: canonicalIssue.reference_no,
        category: canonicalIssue.category,
        status: 'submitted',
        officer_note: 'Issue successfully registered and assigned SLA.',
        report_count: 1,
        sla_hours: defaultSlaHours,
      };

      const notifResult = await runNotificationAgent(notifPrompt);

      await recordAgentRun({
        agentName: 'notification',
        status: notifResult.status,
        inputSummary: { referenceNo: canonicalIssue.reference_no, status: 'submitted' },
        output: notifResult.data,
        reasoning: notifResult.reasoning,
        model: notifResult.model,
        latencyMs: notifResult.latencyMs,
        errorMessage: notifResult.error_message,
        issueId: canonicalIssue.id,
      });

      await notifyReportersForIssue({
        issueId: canonicalIssue.id,
        title: notifResult.data.title,
        message: notifResult.data.message,
        emailSubject: notifResult.data.email_subject,
        emailBody: notifResult.data.email_body,
      });
    }

    logger.info(
      { reportId, issueId: canonicalIssue?.id, isDuplicate },
      'Orchestration pipeline completed successfully'
    );
  } catch (err) {
    logger.error({ error: err.message, reportId }, 'Orchestration pipeline failed');
    if (inMemoryReports.has(reportId)) {
      const rep = inMemoryReports.get(reportId);
      rep.state = 'failed';
      rep.error_message = err.message;
      inMemoryReports.set(reportId, rep);
    }
    try {
      await supabaseAdmin
        .from('reports')
        .update({
          state: 'failed',
          error_message: err.message,
        })
        .eq('id', reportId);
    } catch {}
  } finally {
    imageBufferCache.delete(reportId);
  }
}
