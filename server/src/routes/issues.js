import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireOfficerOrAdmin } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import {
  issueIdParamSchema,
  listIssuesQuerySchema,
  updateStatusSchema,
  overrideSchema,
  reopenIssueSchema,
} from '../validation/issueSchemas.js';
import {
  listPublicIssues,
  getPublicIssueById,
  getIssueDetailForOfficer,
  updateIssueStatus,
  reopenIssue,
  overrideAiDecision,
} from '../services/issueService.js';

export const issuesRouter = Router();

// GET /api/v1/issues (Public)
issuesRouter.get(
  '/issues',
  validate({ query: listIssuesQuerySchema }),
  async (req, res, next) => {
    try {
      const result = await listPublicIssues(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/issues/:id (Public)
issuesRouter.get(
  '/issues/:id',
  validate({ params: issueIdParamSchema }),
  async (req, res, next) => {
    try {
      const issue = await getPublicIssueById(req.params.id);
      res.json({ issue });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/issues/:id/detail (Officer / Admin)
issuesRouter.get(
  '/issues/:id/detail',
  authenticateToken,
  requireOfficerOrAdmin,
  validate({ params: issueIdParamSchema }),
  async (req, res, next) => {
    try {
      const detail = await getIssueDetailForOfficer(req.params.id, req.user);
      res.json({ issue: detail });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/issues/:id/reopen (Citizen Reporter)
issuesRouter.post(
  '/issues/:id/reopen',
  authenticateToken,
  validate({ params: issueIdParamSchema, body: reopenIssueSchema }),
  async (req, res, next) => {
    try {
      const updated = await reopenIssue(req.params.id, req.body.note, req.user);
      res.json({
        message: 'Issue reopened successfully. Municipal officers have been alerted.',
        issue: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/issues/:id/status (Officer / Admin)
issuesRouter.patch(
  '/issues/:id/status',
  authenticateToken,
  requireOfficerOrAdmin,
  validate({ params: issueIdParamSchema, body: updateStatusSchema }),
  async (req, res, next) => {
    try {
      const updated = await updateIssueStatus(req.params.id, req.body, req.user);
      res.json({
        message: 'Issue status updated and citizen reporters notified.',
        issue: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/issues/:id/override (Officer / Admin)
issuesRouter.post(
  '/issues/:id/override',
  authenticateToken,
  requireOfficerOrAdmin,
  validate({ params: issueIdParamSchema, body: overrideSchema }),
  async (req, res, next) => {
    try {
      const updated = await overrideAiDecision(req.params.id, req.body, req.user);
      res.json({
        message: 'AI decision overridden and logged to audit table.',
        issue: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);
