import { Request, Response, NextFunction } from 'express';

export function requireFeature(flag: string, expectedValue: string) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (process.env[flag] !== expectedValue) {
      res.status(404).json({ error: { code: 'FEATURE_DISABLED', message: 'Feature disabled' } });
      return;
    }
    next();
  };
}
