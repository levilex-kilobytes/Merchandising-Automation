import { Request, Response, NextFunction } from 'express';
import { GRNService } from './grn.service';

export class GRNController {
  constructor(private readonly service = new GRNService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = (req as Request & { validatedQuery?: unknown }).validatedQuery ?? req.query;
      res.json(await this.service.listGRNs(filter as never));
    } catch (err) { next(err); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.getGRN(req.params.id)); } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json(await this.service.createGRN(req.body)); } catch (err) { next(err); }
  };

  recordLine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.recordLine(req.params.id, req.body)); } catch (err) { next(err); }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.completeGRN(req.params.id)); } catch (err) { next(err); }
  };
}
