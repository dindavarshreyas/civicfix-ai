import { z } from 'zod';
import { ISSUE_CATEGORIES, ISSUE_STATUSES, PRIORITY_LEVELS } from '../config/constants.js';

export const issueIdParamSchema = z.object({
  id: z.string().uuid('Issue ID must be a valid UUID'),
});

export const listIssuesQuerySchema = z.object({
  category: z.enum(ISSUE_CATEGORIES).optional(),
  status: z.enum(ISSUE_STATUSES).optional(),
  priority: z.enum(Object.values(PRIORITY_LEVELS)).optional(),
  department_id: z.string().uuid().optional(),
  bbox: z.string().regex(/^[-0-9.]+,[-0-9.]+,[-0-9.]+,[-0-9.]+$/, 'bbox must be in format minLng,minLat,maxLng,maxLat').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(ISSUE_STATUSES),
  note: z.string().trim().max(500, 'Status note cannot exceed 500 characters').optional().default(''),
}).superRefine((data, ctx) => {
  if (data.status === 'rejected' && (!data.note || data.note.trim().length < 5)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A rejection reason of at least 5 characters is required when rejecting an issue',
      path: ['note'],
    });
  }
});

export const overrideSchema = z.object({
  field: z.enum(['category', 'priority', 'department']),
  newValue: z.string().min(1, 'New value is required'),
  reason: z.string().trim().min(10, 'Override reason must be at least 10 characters').max(500, 'Reason cannot exceed 500 characters'),
}).superRefine((data, ctx) => {
  if (data.field === 'category' && !ISSUE_CATEGORIES.includes(data.newValue)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid category: must be one of ${ISSUE_CATEGORIES.join(', ')}`,
      path: ['newValue'],
    });
  }
  if (data.field === 'priority' && !Object.values(PRIORITY_LEVELS).includes(data.newValue)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid priority: must be one of ${Object.values(PRIORITY_LEVELS).join(', ')}`,
      path: ['newValue'],
    });
  }
  if (data.field === 'department') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.newValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Department ID must be a valid UUID',
        path: ['newValue'],
      });
    }
  }
});

export const reopenIssueSchema = z.object({
  note: z.string().trim().max(500, 'Note cannot exceed 500 characters').optional().default('Still not fixed - citizen reopened'),
});
