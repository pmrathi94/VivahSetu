// ============================================================================
// VIVAHSETU 2026 - ROLE-BASED ACCESS CONTROL MIDDLEWARE
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    wedding_id?: string;
  };
}

/**
 * Verify JWT and attach user info to request
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No authorization token' });
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch user profile with role
    const { data: userProfile } = await supabase
      .from('users')
      .select('*, roles(role_name)')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email || '',
      role: userProfile?.role_name || 'guest',
      wedding_id: userProfile?.wedding_id || undefined,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Check if user has specific role
 */
export const roleGuard = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        actual: req.user.role,
      });
    }

    next();
  };
};

/**
 * Check if user has access to specific wedding
 */
export const weddingAccessGuard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { wedding_id } = req.params;
    if (!wedding_id) {
      return res.status(400).json({ error: 'Wedding ID required' });
    }

    const { data: wedding } = await supabase
      .from('weddings')
      .select('*')
      .eq('wedding_id', wedding_id)
      .single();

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    // Check if user is part of this wedding
    const { data: userWedding } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', req.user?.id)
      .eq('wedding_id', wedding_id)
      .single();

    if (!userWedding && req.user?.role !== 'app_owner') {
      return res.status(403).json({ error: 'No access to this wedding' });
    }

    req.params.weddingObj = wedding;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Access check failed' });
  }
};

/**
 * Check specific module permission
 */
export const modulePermissionGuard = (moduleName: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Fetch user role with permissions
      const { data: userRole } = await supabase
        .from('users')
        .select('roles(permissions_json)')
        .eq('user_id', req.user?.id)
        .single();

      const permissions = (userRole as any)?.roles?.permissions_json || {};
      
      // Check if module is accessible
      const hasAccess = permissions[moduleName] === true || 
                        permissions.full_access === true;

      if (!hasAccess) {
        return res.status(403).json({
          error: `No permission for ${moduleName}`,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Log all actions for audit trail
 */
export const auditLogger = async (
  req: AuthenticatedRequest,
  moduleName: string,
  action: 'create' | 'update' | 'delete' | 'view',
  recordId: string,
  oldValue?: any,
  newValue?: any
) => {
  try {
    await supabase.from('audit_logs').insert({
      wedding_id: req.user?.wedding_id,
      user_id: req.user?.id,
      module_name: moduleName,
      action,
      record_id: recordId,
      old_value: oldValue,
      new_value: newValue,
      action_timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

export default {
  authMiddleware,
  roleGuard,
  weddingAccessGuard,
  modulePermissionGuard,
  auditLogger,
};
