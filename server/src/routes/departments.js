import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { departmentSchema } from '../validation/adminSchemas.js';
import { supabaseAdmin } from '../config/supabase.js';

export const departmentsRouter = Router();

// GET /api/v1/departments (Public active departments)
departmentsRouter.get('/departments', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('departments')
      .select('id, code, name, description, handles_categories, contact_email, sla_hours, is_active')
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (error) throw error;

    res.json({ departments: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/departments (Admin)
departmentsRouter.post(
  '/admin/departments',
  authenticateToken,
  requireAdmin,
  validate({ body: departmentSchema }),
  async (req, res, next) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .insert(req.body)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ department: data });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/admin/departments/:id (Admin)
departmentsRouter.patch(
  '/admin/departments/:id',
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json({ department: data });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/admin/departments/:id (Admin soft delete)
departmentsRouter.delete(
  '/admin/departments/:id',
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .update({ is_active: false })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) throw error;

      res.json({ message: 'Department deactivated successfully', department: data });
    } catch (err) {
      next(err);
    }
  }
);
