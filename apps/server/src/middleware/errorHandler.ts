import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, url: req.url });
  res.status(500).json({ success: false, error: 'Internal server error' });
}
