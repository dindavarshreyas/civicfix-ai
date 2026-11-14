import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

export const notificationsRouter = Router();

// GET /api/v1/notifications
notificationsRouter.get('/notifications', authenticateToken, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: notifications, count, error } = await supabaseAdmin
      .from('notifications')
      .select('*, issues(reference_no, category, status, priority)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    res.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/notifications/:id/read
notificationsRouter.patch('/notifications/:id/read', authenticateToken, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ notification: data });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/notifications/read-all
notificationsRouter.post('/notifications/read-all', authenticateToken, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});
