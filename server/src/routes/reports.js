import { Router } from 'express';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.js';
import { reportImageUpload } from '../middleware/upload.js';
import { reportSubmitLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  createReportSchema,
  reportIdParamSchema,
  listReportsQuerySchema,
} from '../validation/reportSchemas.js';
import {
  createReportRecord,
  listUserReports,
  getReportDetailById,
  getReportProgress,
} from '../services/reportService.js';
import { sanitizeAndProcessImage } from '../utils/imageProcessing.js';
import { uploadReportImage } from '../services/storageService.js';
import {
  enqueueReportProcessing,
  imageBufferCache,
} from '../agents/orchestrator.js';

export const reportsRouter = Router();

// POST /api/v1/reports
reportsRouter.post(
  '/reports',
  authenticateToken,
  reportSubmitLimiter,
  reportImageUpload,
  validate({ body: createReportSchema }),
  async (req, res, next) => {
    try {
      const { description, latitude, longitude, address_text, landmark } = req.body;
      const file = req.file;

      // Cross-field validation: at least one of description or image required
      if (!file && (!description || description.trim().length === 0)) {
        return res.status(400).json({
          error: {
            code: 'MISSING_EVIDENCE',
            message: 'You must provide at least a photo or a text description (or both) to report a civic issue.',
          },
        });
      }

      const reportId = crypto.randomUUID();
      let storedImagePath = null;
      let processedImage = null;

      if (file) {
        // Validate magic bytes, sanitize and convert to WebP
        processedImage = await sanitizeAndProcessImage(file.buffer);

        // Upload to private Supabase Storage bucket
        storedImagePath = await uploadReportImage(
          req.user.id,
          reportId,
          processedImage.sanitizedBuffer,
          processedImage.mimeType
        );

        // Cache image object in memory for immediate orchestrator pipeline
        imageBufferCache.set(reportId, {
          mimeType: processedImage.mimeType,
          base64: processedImage.base64,
        });
      }

      // Create DB report record
      const report = await createReportRecord({
        userId: req.user.id,
        description,
        imagePath: storedImagePath,
        latitude,
        longitude,
        address_text,
        landmark,
      });

      // Trigger multi-agent pipeline asynchronously without awaiting
      setImmediate(() => {
        enqueueReportProcessing(report.id);
      });

      // 202 Accepted immediately returned to citizen
      return res.status(202).json({
        reportId: report.id,
        status: 'received',
        message: 'Report received. Autonomous multi-agent pipeline initiated.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/reports
reportsRouter.get(
  '/reports',
  authenticateToken,
  validate({ query: listReportsQuerySchema }),
  async (req, res, next) => {
    try {
      const result = await listUserReports(req.user.id, req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/reports/:id
reportsRouter.get(
  '/reports/:id',
  authenticateToken,
  validate({ params: reportIdParamSchema }),
  async (req, res, next) => {
    try {
      const report = await getReportDetailById(req.params.id, req.user);
      res.json({ report });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/reports/:id/progress
reportsRouter.get(
  '/reports/:id/progress',
  authenticateToken,
  validate({ params: reportIdParamSchema }),
  async (req, res, next) => {
    try {
      const progress = await getReportProgress(req.params.id, req.user);
      res.json(progress);
    } catch (err) {
      next(err);
    }
  }
);
