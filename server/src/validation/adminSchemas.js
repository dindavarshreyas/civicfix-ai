import { z } from 'zod';
import { ISSUE_CATEGORIES, USER_ROLES } from '../config/constants.js';

export const departmentSchema = z.object({
  code: z.string().trim().min(2).max(10).toUpperCase(),
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().min(5).max(500),
  handles_categories: z.array(z.enum(ISSUE_CATEGORIES)).min(1, 'Department must handle at least one category'),
  contact_email: z.string().email().optional().nullable(),
  sla_hours: z.object({
    critical: z.coerce.number().int().min(1).max(720).default(24),
    high: z.coerce.number().int().min(1).max(720).default(72),
    medium: z.coerce.number().int().min(1).max(720).default(168),
    low: z.coerce.number().int().min(1).max(720).default(336),
  }).default({ critical: 24, high: 72, medium: 168, low: 336 }),
  is_active: z.boolean().default(true),
});

export const roleUpdateSchema = z.object({
  role: z.enum([USER_ROLES.CITIZEN, USER_ROLES.OFFICER, USER_ROLES.ADMIN]),
  department_id: z.string().uuid().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.role === USER_ROLES.OFFICER && !data.department_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'department_id is required when assigning the officer role',
      path: ['department_id'],
    });
  }
});

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120).optional(),
  phone: z.string().trim().max(25).optional().nullable(),
  email_notifications: z.boolean().optional(),
});

export const agentRunsQuerySchema = z.object({
  report_id: z.string().uuid().optional(),
  issue_id: z.string().uuid().optional(),
  agent_name: z.string().optional(),
  status: z.enum(['running', 'succeeded', 'failed', 'fallback']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
