import { Request, Response, NextFunction } from 'express';
import { ReturnService } from './return.service';

export class ReturnController {
  constructor(private readonly service = new ReturnService()) {}
  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.list()); } catch (e) { next(e); }
  };
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.get(req.params.id)); } catch (e) { next(e); }
  };
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json(await this.service.create(req.body)); } catch (e) { next(e); }
  };
}
