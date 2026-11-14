import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validation/adminSchemas.js';
import { supabaseAdmin } from '../config/supabase.js';

export const meRouter = Router();

// GET /api/v1/me
meRouter.get('/me', authenticateToken, async (req, res, next) => {
  try {
    let profile = null;

    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*, departments(id, code, name)')
        .eq('id', req.user.id)
        .maybeSingle();
      if (data) profile = data;
    } catch {}

    if (!profile) {
      try {
        const { data } = await supabaseAdmin
          .from('users')
          .select('*, departments(id, code, name)')
          .eq('id', req.user.id)
          .maybeSingle();
        if (data) profile = data;
      } catch {}
    }

    res.json({
      user: {
        ...(profile || req.user),
        email: req.user.email || profile?.email || '',
      },
    });
  } catch (err) {
    res.json({ user: req.user });
  }
});

// PATCH /api/v1/me
meRouter.patch(
  '/me',
  authenticateToken,
  validate({ body: updateProfileSchema }),
  async (req, res, next) => {
    try {
      const { full_name, phone, email_notifications } = req.body;
      const updateData = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (phone !== undefined) updateData.phone = phone;
      if (email_notifications !== undefined) updateData.email_notifications = email_notifications;

      try {
        await supabaseAdmin.from('profiles').update(updateData).eq('id', req.user.id);
      } catch {}

      try {
        await supabaseAdmin.from('users').update(updateData).eq('id', req.user.id);
      } catch {}

      res.json({
        user: {
          ...req.user,
          ...updateData,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
