import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/db';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'brokersaab_secret_access_token_12345_dev_super_secret';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phoneNumber: string;
    role: Role;
  };
}

/**
 * Middleware verifying JWT Access Tokens in Authorization header.
 */
export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authorization header missing or invalid' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as {
      id: string;
      phoneNumber: string;
      role: Role;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid or expired access token' });
  }
};

/**
 * RBAC Permission filter restricting resources to authorized roles.
 */
export const requireRole = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Requires one of: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Audit log utility helper.
 */
export const logAuditEvent = async (
  action: string,
  performedBy: string,
  details: object,
  advisorId?: string,
  req?: Request
) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        performedBy,
        advisorId,
        details: details as any,
        ipAddress: req?.ip || '0.0.0.0',
        userAgent: req?.headers['user-agent'] || 'unknown'
      }
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};
