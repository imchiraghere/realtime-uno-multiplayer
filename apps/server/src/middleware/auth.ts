import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: { userId: string; username: string; isAdmin: boolean };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }
  
  try {
    const token = auth.slice(7);
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
}
