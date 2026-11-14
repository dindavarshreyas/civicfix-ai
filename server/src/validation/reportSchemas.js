import { z } from 'zod';

export const createReportSchema = z.object({
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters').optional().nullable(),
  latitude: z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  address_text: z.string().trim().max(300, 'Address text cannot exceed 300 characters').optional().nullable(),
  landmark: z.string().trim().max(150, 'Landmark cannot exceed 150 characters').optional().nullable(),
  consent: z.preprocess((val) => val === true || val === 'true' || val === 1 || val === '1', z.literal(true, {
    errorMap: () => ({ message: 'You must give consent to submit this civic report' }),
  })),
}).superRefine((data, ctx) => {
  // If description is provided, it must be at least 10 chars
  if (data.description && data.description.length > 0 && data.description.length < 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Description must be at least 10 characters long when provided',
      path: ['description'],
    });
  }
});

export const reportIdParamSchema = z.object({
  id: z.string().uuid('Report ID must be a valid UUID'),
});

export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
