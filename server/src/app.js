import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';
import { reportsRouter } from './routes/reports.js';
import { issuesRouter } from './routes/issues.js';
import { notificationsRouter } from './routes/notifications.js';
import { departmentsRouter } from './routes/departments.js';
import { adminRouter } from './routes/admin.js';
import { agentRunsRouter } from './routes/agentRuns.js';

export const app = express();

// Required for Render reverse proxy
app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', '*.tile.openstreetmap.org'],
        connectSrc: ["'self'", env.SUPABASE_URL, 'https://*.supabase.co', 'https://*.tile.openstreetmap.org'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4000',
  'http://localhost:3000',
  'https://civicfix-ai-974r-meow-5169.vercel.app',
  ...(env.CLIENT_ORIGIN ? env.CLIENT_ORIGIN.split(',').map((o) => o.trim()) : []),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Match allowed origins list or any vercel.app deployment preview/production
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('civicfix') ||
        origin.includes('civicmind');

      if (isAllowed) {
        return callback(null, origin);
      }

      // Default fallback: allow origin to support dynamic preview URLs
      return callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret', 'Bypass-Tunnel-Reminder', 'bypass-tunnel-reminder'],
  })
);

// Cookie parser for refresh token
app.use(cookieParser());

// Logging
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/api/v1/health',
    },
  })
);

// Rate limiting
app.use('/api', globalLimiter);

// Body parsing with 100kb limit (multipart handled by multer)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// API Routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);
apiRouter.use(healthRouter);
apiRouter.use(meRouter);
apiRouter.use(reportsRouter);
apiRouter.use(issuesRouter);
apiRouter.use(notificationsRouter);
apiRouter.use(departmentsRouter);
apiRouter.use(adminRouter);
apiRouter.use(agentRunsRouter);

app.use('/api/v1', apiRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Central error handler
app.use(errorHandler);
