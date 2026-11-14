import { supabaseAdmin } from '../config/supabase.js';
import { verifyAccessToken } from '../utils/token.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware that verifies Custom JWT access token and attaches user profile to req.user.
 * Denies access by default if token is missing or invalid.
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header. Expected Bearer token.',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token not provided.',
        },
      });
    }

    // Verify JWT access token
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (jwtErr) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Session has expired or access token is invalid. Please refresh or sign in again.',
        },
      });
    }

    if (!payload?.sub) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token payload missing subject identifier.',
        },
      });
    }

    // Load user record from public.users or public.profiles table
    let user = null;

    // Check users table
    try {
      const { data: u } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role, department_id, phone, email_notifications')
        .eq('id', payload.sub)
        .maybeSingle();

      if (u) user = u;
    } catch {}

    // Check profiles table
    if (!user) {
      try {
        const { data: p } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, role, department_id, phone, email_notifications')
          .eq('id', payload.sub)
          .maybeSingle();

        if (p) {
          user = {
            ...p,
            email: payload.email || (payload.sub === '13d7e10d-7ca8-4cab-af9d-9aa505b8b882' ? 'citizen@demo.test' : (payload.sub === '16a0495f-d0be-4a09-9f84-21cb0228908c' ? 'officer@demo.test' : (payload.sub === '266f3232-6603-410e-ac56-537f96a02dd4' ? 'admin@demo.test' : ''))),
          };
        }
      } catch {}
    }

    // Check auth.users as fallback
    if (!user) {
      try {
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(payload.sub);
        if (authData?.user) {
          user = {
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0],
            role: authData.user.user_metadata?.role || payload.role || 'citizen',
            department_id: authData.user.user_metadata?.department_id || payload.departmentId || null,
            phone: null,
            email_notifications: true,
          };
        }
      } catch {}
    }

    // Demo user fallback
    if (!user && payload?.sub) {
      const demoUsers = {
        '13d7e10d-7ca8-4cab-af9d-9aa505b8b882': { email: 'citizen@demo.test', role: 'citizen', full_name: 'Jane Citizen' },
        '16a0495f-d0be-4a09-9f84-21cb0228908c': { email: 'officer@demo.test', role: 'officer', full_name: 'Officer Vikram' },
        '266f3232-6603-410e-ac56-537f96a02dd4': { email: 'admin@demo.test', role: 'admin', full_name: 'Commissioner Sarah Admin' },
      };
      if (demoUsers[payload.sub]) {
        user = {
          id: payload.sub,
          ...demoUsers[payload.sub],
          department_id: payload.departmentId || null,
          phone: '+1 555-0199',
          email_notifications: true,
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account not found or has been removed.',
        },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error({ error: err.message }, 'Authentication middleware failure');
    return res.status(500).json({
      error: {
        code: 'INTERNAL_AUTH_ERROR',
        message: 'Internal error during authentication check.',
      },
    });
  }
}

/**
 * Optional authentication: attaches req.user if valid token provided, but doesn't block if missing.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    const payload = verifyAccessToken(token);
    if (payload?.sub) {
      let user = null;
      try {
        const { data: u } = await supabaseAdmin.from('users').select('*').eq('id', payload.sub).maybeSingle();
        if (u) user = u;
      } catch {}

      if (!user) {
        try {
          const { data: p } = await supabaseAdmin.from('profiles').select('*').eq('id', payload.sub).maybeSingle();
          if (p) user = p;
        } catch {}
      }

      req.user = user;
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}
