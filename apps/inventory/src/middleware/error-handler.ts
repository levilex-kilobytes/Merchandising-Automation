import { Request, Response, NextFunction } from 'express';
import { AppError } from '@mfa/errors';
import { Logger } from '@mfa/logger';

export function errorHandler(logger: Logger) {
  return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    // Prefer instanceof, but fall back to duck-typing on code+statusCode
    // in case of duplicate module instances
    const isAppError =
      err instanceof AppError ||
      (err as any)?.code !== undefined && typeof (err as any)?.statusCode === 'number';

    if (isAppError) {
      const e = err as AppError & { statusCode: number; code: string; details?: unknown };
      res.status(e.statusCode).json({
        error: { code: e.code, message: e.message, details: e.details },
      });
      return;
    }

    logger.error('Unhandled error', { err: String(err), stack: err.stack });
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
  };
}
