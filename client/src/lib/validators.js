import { z } from 'zod';

export const reportFormSchema = z.object({
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters').optional().or(z.literal('')),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address_text: z.string().trim().max(300, 'Address cannot exceed 300 characters').optional().or(z.literal('')),
  landmark: z.string().trim().max(150, 'Landmark cannot exceed 150 characters').optional().or(z.literal('')),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm that this is an accurate report and grant consent to process it.' }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const overrideFormSchema = z.object({
  field: z.enum(['category', 'priority', 'department']),
  newValue: z.string().min(1, 'Please select or enter the new value'),
  reason: z.string().trim().min(10, 'A reason of at least 10 characters is required for audit compliance').max(500),
});
