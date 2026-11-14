import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env or server/.env
dotenv.config();
if (!process.env.SUPABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),

  // Supabase (Server uses service role ONLY; Managed Postgres & Storage)
  SUPABASE_URL: z.string().url().default('https://placeholder-project.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('placeholder-service-role-key-for-development-only'),
  SUPABASE_STORAGE_BUCKET: z.string().default('issue-images'),
  DATABASE_URL: z.string().optional().default(''),

  // Custom Authentication (JWT + Bcrypt)
  JWT_ACCESS_SECRET: z.string().min(32).default('civicmind-jwt-access-secret-32-chars-minimum-key!'),
  JWT_REFRESH_SECRET: z.string().min(32).default('civicmind-jwt-refresh-secret-32-chars-minimum-key!'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
  BCRYPT_COST: z.coerce.number().default(12),
  COOKIE_SECURE: z.preprocess((val) => {
    if (typeof val === 'string') return val === 'true' || val === '1';
    return Boolean(val);
  }, z.boolean()).default(process.env.NODE_ENV === 'production'),

  // Demo & Workflow Controls
  DEMO_TIME_SCALE: z.coerce.number().default(1),
  CRON_SECRET: z.string().min(16).default('civicmind-cron-secret-super-secure-key-2026'),
  DEMO_PASSWORD: z.string().default('DemoPassword123!'),

  // Gemini AI
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  AI_TIMEOUT_MS: z.coerce.number().default(30000),
  AI_MAX_RETRIES: z.coerce.number().default(2),
  AI_CONCURRENCY: z.coerce.number().default(3),

  // Pipeline tuning
  DUPLICATE_RADIUS_M: z.coerce.number().default(75),
  DUPLICATE_LOOKBACK_DAYS: z.coerce.number().default(30),
  DUPLICATE_MAX_CANDIDATES: z.coerce.number().default(5),
  DUPLICATE_MERGE_MIN_SIMILARITY: z.coerce.number().default(0.6),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().default(0.55),
  MAX_REPORTS_PER_USER_PER_DAY: z.coerce.number().default(15),

  // Simulated workflow
  WORKFLOW_ENABLED: z.coerce.boolean().default(true),
  WORKFLOW_TICK_CRON: z.string().default('* * * * *'),
  DEPARTMENT_API_URL: z.string().optional().default(''),

  // Email
  EMAIL_ADAPTER: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('CivicMind <noreply@example.com>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:\n', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
