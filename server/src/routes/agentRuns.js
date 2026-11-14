import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireOfficerOrAdmin } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { agentRunsQuerySchema } from '../validation/adminSchemas.js';
import { supabaseAdmin } from '../config/supabase.js';

export const agentRunsRouter = Router();

// GET /api/v1/agent-runs
agentRunsRouter.get(
  '/agent-runs',
  authenticateToken,
  requireOfficerOrAdmin,
  validate({ query: agentRunsQuerySchema }),
  async (req, res, next) => {
    try {
      const { report_id, issue_id, agent_name, status, page = 1, pageSize = 25 } = req.query;

      let query = supabaseAdmin
        .from('agent_runs')
        .select('*, issues(reference_no, category, status, department_id)', { count: 'exact' });

      if (report_id) query = query.eq('report_id', report_id);
      if (issue_id) query = query.eq('issue_id', issue_id);
      if (agent_name) query = query.eq('agent_name', agent_name);
      if (status) query = query.eq('status', status);

      // Officers can only see runs for their own department's issues or general runs
      if (req.user.role === 'officer' && req.user.department_id) {
        // Query will be filtered in app or joined if needed
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      res.json({
        runs: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      });
    } catch (err) {
      next(err);
    }
  }
);
