/**
 * Requires the authenticated user to hold one of the specified roles.
 * @param  {...string} roles 
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of roles: [${roles.join(', ')}]`,
        },
      });
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireOfficerOrAdmin = requireRole('officer', 'admin');
