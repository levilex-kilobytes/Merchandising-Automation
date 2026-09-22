import { Request, Response, NextFunction } from 'express';
import { AppError } from '@mfa/errors';
import { Logger } from '@mfa/logger';

export function errorHandler(logger: Logger) {
  return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    logger.error('Unhandled error', { err: String(err) });
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
  };
}
