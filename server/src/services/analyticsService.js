import { supabaseAdmin } from '../config/supabase.js';

export async function getAdminAnalytics() {
  // 1. Total counts by category
  const { data: allIssues } = await supabaseAdmin
    .from('issues')
    .select('id, category, department_id, status, priority, priority_score, report_count, sla_due_at, first_reported_at, resolved_at, created_at');

  const issues = allIssues || [];

  const categoryCounts = {};
  const statusCounts = {};
  const priorityCounts = {};
  let totalResolutionHours = 0;
  let resolvedCount = 0;
  let slaBreachCount = 0;
  let totalReportsMerged = 0;
  const now = new Date();

  for (const issue of issues) {
    categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
    statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
    priorityCounts[issue.priority] = (priorityCounts[issue.priority] || 0) + 1;

    // Duplicates merged count
    if (issue.report_count > 1) {
      totalReportsMerged += (issue.report_count - 1);
    }

    // SLA breach check
    if (issue.sla_due_at) {
      const dueTime = new Date(issue.sla_due_at);
      if (issue.status === 'resolved' && issue.resolved_at) {
        if (new Date(issue.resolved_at) > dueTime) {
          slaBreachCount++;
        }
      } else if (!['resolved', 'closed', 'rejected'].includes(issue.status) && now > dueTime) {
        slaBreachCount++;
      }
    }

    // Resolution hours
    if (issue.status === 'resolved' && issue.resolved_at && issue.first_reported_at) {
      const start = new Date(issue.first_reported_at);
      const end = new Date(issue.resolved_at);
      const diffHours = (end - start) / (1000 * 3600);
      if (diffHours >= 0) {
        totalResolutionHours += diffHours;
        resolvedCount++;
      }
    }
  }

  const avgResolutionHours = resolvedCount > 0 ? Math.round((totalResolutionHours / resolvedCount) * 10) / 10 : 0;
  const totalReportsCount = issues.reduce((acc, curr) => acc + (curr.report_count || 1), 0);
  const duplicateMergeRatio = totalReportsCount > 0 ? Math.round((totalReportsMerged / totalReportsCount) * 100) / 100 : 0;

  // Department counts
  const { data: departments } = await supabaseAdmin.from('departments').select('id, code, name');
  const departmentCounts = (departments || []).map((dept) => {
    const count = issues.filter((i) => i.department_id === dept.id).length;
    return {
      departmentId: dept.id,
      code: dept.code,
      name: dept.name,
      count,
    };
  });

  // 30-day daily trend
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const dailyTrendMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyTrendMap[key] = { date: key, created: 0, resolved: 0 };
  }

  for (const issue of issues) {
    if (issue.created_at) {
      const createdKey = issue.created_at.split('T')[0];
      if (dailyTrendMap[createdKey]) {
        dailyTrendMap[createdKey].created++;
      }
    }
    if (issue.resolved_at) {
      const resolvedKey = issue.resolved_at.split('T')[0];
      if (dailyTrendMap[resolvedKey]) {
        dailyTrendMap[resolvedKey].resolved++;
      }
    }
  }

  return {
    totalIssues: issues.length,
    totalReports: totalReportsCount,
    categoryCounts,
    statusCounts,
    priorityCounts,
    departmentCounts,
    avgResolutionHours,
    slaBreachCount,
    totalReportsMerged,
    duplicateMergeRatio,
    trend: Object.values(dailyTrendMap),
  };
}
