import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '@mfa/errors';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) { next(new ValidationError('Invalid body', result.error.flatten())); return; }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) { next(new ValidationError('Invalid query', result.error.flatten())); return; }
    (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    next();
  };
}
