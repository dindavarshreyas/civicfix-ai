import { ZodError } from 'zod';

/**
 * Validates request body, query, and params against Zod schemas.
 * Returns 400 with structured validation details on failure.
 */
export function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));

        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            details: issues,
          },
        });
      }
      next(err);
    }
  };
}

export function validateBody(schema) {
  return validate({ body: schema });
}
