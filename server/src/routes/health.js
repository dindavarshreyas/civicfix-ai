import { Router } from 'express';
import { checkSupabaseConnection } from '../config/supabase.js';

export const healthRouter = Router();

healthRouter.get('/health', async (req, res) => {
  const dbOk = await checkSupabaseConnection();
  const status = dbOk ? 'healthy' : 'degraded';

  res.status(dbOk ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      api: 'up',
      database: dbOk ? 'connected' : 'unreachable',
    },
  });
});
