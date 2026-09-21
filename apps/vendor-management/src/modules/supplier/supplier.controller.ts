import { Request, Response, NextFunction } from 'express';
import { SupplierService } from './supplier.service';

export class SupplierController {
  constructor(private readonly service = new SupplierService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = (req as Request & { validatedQuery?: unknown }).validatedQuery ?? req.query;
      res.json(await this.service.listSuppliers(filter as never));
    } catch (err) { next(err); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.getSupplier(req.params.id)); } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json(await this.service.createSupplier(req.body)); } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.updateSupplier(req.params.id, req.body)); } catch (err) { next(err); }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reason = (req.body && typeof req.body === 'object' && 'reason' in req.body)
        ? String((req.body as { reason?: unknown }).reason)
        : 'unspecified';
      await this.service.deactivateSupplier(req.params.id, reason);
      res.status(204).send();
    } catch (err) { next(err); }
  };
}
