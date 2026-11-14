import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { roleUpdateSchema } from '../validation/adminSchemas.js';
import { getAdminAnalytics } from '../services/analyticsService.js';
import { triggerWorkflowTick } from '../workflow/scheduler.js';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';

export const adminRouter = Router();

/**
 * Middleware that allows either an authenticated Admin or an external cron pinger
 * providing the matching x-cron-secret header.
 */
function allowAdminOrCronSecret(req, res, next) {
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret && cronSecret === env.CRON_SECRET) {
    req.cronTriggered = true;
    return next();
  }

  return authenticateToken(req, res, (err) => {
    if (err) return next(err);
    return requireAdmin(req, res, next);
  });
}

// GET /api/v1/admin/analytics
adminRouter.get('/admin/analytics', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const stats = await getAdminAnalytics();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/users
adminRouter.get('/admin/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 25));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: users, count, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, department_id, phone, email_notifications, created_at, departments(id, code, name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      users: users || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/users/:id/role
adminRouter.patch(
  '/admin/users/:id/role',
  authenticateToken,
  requireAdmin,
  validate({ body: roleUpdateSchema }),
  async (req, res, next) => {
    try {
      const { role, department_id } = req.body;

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          role,
          department_id: role === 'officer' ? department_id : null,
        })
        .eq('id', req.params.id)
        .select('id, email, full_name, role, department_id, phone, email_notifications, created_at, departments(id, code, name)')
        .single();

      if (error) throw error;

      res.json({ user: data });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/internal/workflow/tick (Admin manual trigger or external cron with x-cron-secret)
adminRouter.post('/internal/workflow/tick', allowAdminOrCronSecret, async (req, res, next) => {
  try {
    const result = await triggerWorkflowTick();
    res.json({
      message: 'Workflow tick triggered successfully',
      result,
    });
  } catch (err) {
    next(err);
  }
});
