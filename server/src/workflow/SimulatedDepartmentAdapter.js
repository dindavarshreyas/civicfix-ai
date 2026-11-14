import { DepartmentAdapter } from './DepartmentAdapter.js';
import { env } from '../config/env.js';

/**
 * Deterministic hash from UUID string to float [0, 1)
 */
function hashUuidToFloat(uuid) {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash << 5) - hash + uuid.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

/**
 * SimulatedDepartmentAdapter advances issue status through realistic civic timelines
 * based on elapsed time relative to SLA hours, with DEMO_TIME_SCALE support.
 */
export class SimulatedDepartmentAdapter extends DepartmentAdapter {
  async submitComplaint(issue) {
    const extPrefix = issue.department_id ? 'MUNI' : 'EXT';
    return {
      externalRef: `${extPrefix}-${Date.now().toString(36).toUpperCase()}-${issue.reference_no.replace('CIV-', '')}`,
    };
  }

  async fetchStatus(issue) {
    const { status, created_at, resolved_at, sla_due_at, id } = issue;

    // Terminal statuses do not advance
    if (['closed', 'rejected'].includes(status)) {
      return null;
    }

    const timeScale = Number(env.DEMO_TIME_SCALE) || 1;
    const now = Date.now();
    const createdAt = new Date(created_at).getTime();
    const elapsedMinutes = ((now - createdAt) / (1000 * 60)) * timeScale;

    const slaDue = sla_due_at ? new Date(sla_due_at).getTime() : createdAt + 72 * 3600 * 1000;
    const totalSlaMinutes = Math.max(60, (slaDue - createdAt) / (1000 * 60));
    const slaProgressRatio = elapsedMinutes / totalSlaMinutes;

    const seed = hashUuidToFloat(id);
    const isSlaBreachCandidate = seed < 0.08; // 8% breach demo rate

    // If already resolved, check if 24 hours passed for auto-close
    if (status === 'resolved') {
      const resolvedAt = resolved_at ? new Date(resolved_at).getTime() : now;
      const hoursSinceResolved = ((now - resolvedAt) / (1000 * 3600)) * timeScale;
      if (hoursSinceResolved >= 24) {
        return {
          status: 'closed',
          note: 'Issue automatically closed after 24 hours of resolution with no reopen dispute.',
          at: new Date().toISOString(),
        };
      }
      return null;
    }

    // Step 1: submitted -> triaged (~1.5 minutes or 2% SLA)
    if (status === 'submitted') {
      if (elapsedMinutes >= 1.5 || slaProgressRatio >= 0.02) {
        return {
          status: 'triaged',
          note: 'Automated civic intake complete. Report validated and classified for municipal response.',
          at: new Date().toISOString(),
        };
      }
      return null;
    }

    // Step 2: triaged -> assigned (~10% SLA)
    if (status === 'triaged') {
      if (slaProgressRatio >= 0.1 || elapsedMinutes >= 3) {
        return {
          status: 'assigned',
          note: 'Assigned to municipal field engineering team and designated ward inspector.',
          at: new Date().toISOString(),
        };
      }
      return null;
    }

    // Step 3: assigned -> in_progress (~30% SLA)
    if (status === 'assigned') {
      if (slaProgressRatio >= 0.3 || elapsedMinutes >= 6) {
        return {
          status: 'in_progress',
          note: 'Field crew dispatched on-site. Remediation works and equipment deployment underway.',
          at: new Date().toISOString(),
        };
      }
      return null;
    }

    // Step 4: in_progress -> resolved (~85% - 100% SLA)
    if (status === 'in_progress') {
      if (isSlaBreachCandidate && slaProgressRatio > 1.05 && slaProgressRatio < 1.4) {
        // Intentionally keep in progress past SLA for breach demonstration
        return null;
      }

      if (slaProgressRatio >= 0.85 || elapsedMinutes >= 12) {
        return {
          status: 'resolved',
          note: 'Remediation completed by field division. Verification inspection passed.',
          at: new Date().toISOString(),
        };
      }
      return null;
    }

    // Step 5: reopened -> in_progress
    if (status === 'reopened') {
      if (elapsedMinutes >= 2) {
        return {
          status: 'in_progress',
          note: 'Reopened complaint acknowledged. Senior supervisor re-assigned for immediate re-inspection.',
          at: new Date().toISOString(),
        };
      }
      return null;
    }

    return null;
  }
}
