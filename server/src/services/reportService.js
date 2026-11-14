import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { getSignedImageUrl } from './storageService.js';
import { logger } from '../utils/logger.js';

// In-memory fallback stores when Supabase tables are being initialized
export const inMemoryReports = new Map();
export const inMemoryAgentRuns = new Map();

/**
 * Checks if user exceeded daily reporting quota.
 */
export async function checkUserDailyReportQuota(userId) {
  try {
    const maxDaily = env.MAX_REPORTS_PER_USER_PER_DAY || 15;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabaseAdmin
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    if (!error && count !== null && count >= maxDaily) {
      const quotaErr = new Error(`Daily report limit of ${maxDaily} reports exceeded. Please try again tomorrow.`);
      quotaErr.statusCode = 429;
      quotaErr.code = 'DAILY_QUOTA_EXCEEDED';
      throw quotaErr;
    }
  } catch (err) {
    if (err.statusCode === 429) throw err;
  }
}

/**
 * Creates initial report in DB (with in-memory fallback if schema uninitialized or RLS error).
 */
export async function createReportRecord({
  userId,
  description,
  imagePath,
  latitude,
  longitude,
  address_text,
  landmark,
}) {
  try {
    await checkUserDailyReportQuota(userId);
  } catch (quotaErr) {
    if (quotaErr.statusCode === 429) throw quotaErr;
  }

  const reportId = crypto.randomUUID();
  const reportObj = {
    id: reportId,
    user_id: userId,
    description: description || null,
    image_path: imagePath || null,
    latitude,
    longitude,
    address_text: address_text || null,
    landmark: landmark || null,
    state: 'received',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert(reportObj)
      .select()
      .single();

    if (error) {
      logger.warn({ error: error.message, code: error.code, reportId }, 'Supabase reports insert notice; using in-memory store');
      inMemoryReports.set(reportId, reportObj);
      return reportObj;
    }

    inMemoryReports.set(data.id, data);
    return data;
  } catch (err) {
    logger.warn({ err: err.message, reportId }, 'Exception during Supabase reports insert; using in-memory store');
    inMemoryReports.set(reportId, reportObj);
    return reportObj;
  }
}

/**
 * Lists reports for the authenticated citizen.
 */
export async function listUserReports(userId, { page = 1, pageSize = 10 }) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabaseAdmin
    .from('reports')
    .select(`
      id,
      description,
      image_path,
      latitude,
      longitude,
      address_text,
      landmark,
      state,
      is_duplicate,
      created_at,
      issues(id, reference_no, category, title, status, priority, priority_score, departments(name, code))
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    logger.warn({ error: error.message, userId }, 'Supabase query error; using in-memory reports');
    const userMems = Array.from(inMemoryReports.values()).filter((r) => r.user_id === userId);
    return {
      reports: userMems,
      total: userMems.length,
      page,
      pageSize,
      totalPages: Math.ceil(userMems.length / pageSize),
    };
  }

  // Merge in-memory reports for this user that are not yet in Supabase
  const inMemForUser = Array.from(inMemoryReports.values()).filter(
    (r) => r.user_id === userId && !(data || []).some((dbR) => dbR.id === r.id)
  );
  const combinedReports = [...inMemForUser, ...(data || [])];

  const reportsWithImages = await Promise.all(
    combinedReports.map(async (rep) => {
      let imageUrl = null;
      if (rep.image_path) {
        imageUrl = await getSignedImageUrl(rep.image_path, 300);
      }
      return {
        ...rep,
        imageUrl,
      };
    })
  );

  const totalCount = (count || 0) + inMemForUser.length;

  return {
    reports: reportsWithImages,
    total: totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

/**
 * Gets report detail by ID for the reporter, officer, or admin.
 */
export async function getReportDetailById(reportId, user) {
  let report = null;

  const { data, error } = await supabaseAdmin
    .from('reports')
    .select(`
      *,
      issues(*, departments(*))
    `)
    .eq('id', reportId)
    .single();

  if (error || !data) {
    report = inMemoryReports.get(reportId);
    if (!report) {
      const notFound = new Error('Report not found');
      notFound.statusCode = 404;
      throw notFound;
    }
  } else {
    report = data;
  }

  const isOwner = report.user_id === user.id;
  const isAdmin = user.role === 'admin';
  const isOfficer = user.role === 'officer';

  if (!isOwner && !isAdmin && !isOfficer) {
    const forbidden = new Error('You do not have permission to view this report');
    forbidden.statusCode = 403;
    throw forbidden;
  }

  let imageUrl = null;
  if (report.image_path) {
    imageUrl = await getSignedImageUrl(report.image_path, 300);
  }

  return {
    ...report,
    imageUrl,
  };
}

/**
 * Fetches real-time pipeline step progress for the /report/processing/:id screen.
 */
export async function getReportProgress(reportId, user) {
  let report = null;

  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('id, user_id, state, is_duplicate, issue_id, error_message, issues(id, reference_no, category, title, status, priority, priority_score, complaint, report_count, departments(name, code))')
    .eq('id', reportId)
    .single();

  if (error || !data) {
    report = inMemoryReports.get(reportId);
    if (!report) {
      const notFound = new Error('Report not found');
      notFound.statusCode = 404;
      throw notFound;
    }
  } else {
    report = data;
  }

  if (report.user_id !== user.id && user.role !== 'admin' && user.role !== 'officer') {
    const forbidden = new Error('Access forbidden');
    forbidden.statusCode = 403;
    throw forbidden;
  }

  // Query agent runs from DB
  const { data: runs } = await supabaseAdmin
    .from('agent_runs')
    .select('step_order, agent_name, status, reasoning, model, latency_ms, created_at')
    .eq('report_id', reportId)
    .order('step_order', { ascending: true });

  const steps = (runs && runs.length > 0) ? runs : (inMemoryAgentRuns.get(reportId) || []);

  return {
    reportId,
    state: report.state,
    isDuplicate: report.is_duplicate || false,
    errorMessage: report.error_message || null,
    issue: report.issues || null,
    steps,
  };
}
