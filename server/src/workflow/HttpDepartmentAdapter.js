import { DepartmentAdapter } from './DepartmentAdapter.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * HttpDepartmentAdapter connects CivicMind to a live external municipal REST API.
 */
export class HttpDepartmentAdapter extends DepartmentAdapter {
  constructor(baseUrl = env.DEPARTMENT_API_URL) {
    super();
    this.baseUrl = baseUrl;
  }

  async submitComplaint(issue) {
    if (!this.baseUrl) {
      throw new Error('DEPARTMENT_API_URL is not set for HttpDepartmentAdapter');
    }

    try {
      const res = await fetch(`${this.baseUrl}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceNumber: issue.reference_no,
          category: issue.category,
          title: issue.title,
          summary: issue.summary,
          priority: issue.priority,
          latitude: issue.latitude,
          longitude: issue.longitude,
          complaintDocument: issue.complaint,
        }),
      });

      if (!res.ok) {
        throw new Error(`External municipal API returned ${res.status}`);
      }

      const data = await res.json();
      return { externalRef: data.externalReferenceNumber || data.id };
    } catch (err) {
      logger.error({ error: err.message }, 'Failed to submit complaint to external municipal API');
      throw err;
    }
  }

  async fetchStatus(issue) {
    if (!this.baseUrl) return null;

    try {
      const res = await fetch(`${this.baseUrl}/complaints/${issue.reference_no}/status`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`External API returned ${res.status}`);
      }
      const data = await res.json();
      return {
        status: data.status,
        note: data.note || 'Status updated from municipal ERP',
        at: data.updatedAt || new Date().toISOString(),
      };
    } catch (err) {
      logger.warn({ error: err.message, issueId: issue.id }, 'External municipal API status check failed');
      return null;
    }
  }
}
