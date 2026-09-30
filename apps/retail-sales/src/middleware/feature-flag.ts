import { Request, Response, NextFunction } from 'express';

export function requireFeature(flag: string, expected: string) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (process.env[flag] !== expected) {
      res.status(404).json({ error: { code: 'FEATURE_DISABLED', message: 'Feature disabled' } });
      return;
    }
    next();
  };
}
