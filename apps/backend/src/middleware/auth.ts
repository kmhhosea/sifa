import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

interface JwtPayload {
  userId: string;
  role: string;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET || 'dev-secret';

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET || 'dev-secret';

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
}
