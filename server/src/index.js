import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { checkSupabaseConnection } from './config/supabase.js';
import { ensureStorageBucket } from './services/storageService.js';
import { startWorkflowScheduler } from './workflow/scheduler.js';
import { recoverStuckReports } from './agents/orchestrator.js';

const PORT = env.PORT || 4000;

async function bootstrap() {
  logger.info({ nodeEnv: env.NODE_ENV, port: PORT }, 'Starting CivicMind Server...');

  // Supabase check
  const isDbConnected = await checkSupabaseConnection();
  if (isDbConnected) {
    logger.info('Supabase database connection established');
    await ensureStorageBucket();
  } else {
    logger.warn('Supabase database query unconfirmed. Ensure migrations are applied.');
  }

  // Recovery job on startup
  await recoverStuckReports();

  // Start workflow scheduler
  const workflowJob = startWorkflowScheduler();

  const server = app.listen(PORT, () => {
    logger.info(`CivicMind API Server running at http://localhost:${PORT}/api/v1`);
    logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    logger.info({ signal }, 'Shutting down gracefully...');
    if (workflowJob) workflowJob.stop();
    server.close(() => {
      logger.info('HTTP server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start CivicMind Server');
  process.exit(1);
});
