import { Request, Response, NextFunction } from 'express';
import { SaleService } from './sale.service';

export class SaleController {
  constructor(private readonly service = new SaleService()) {}
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.list({ storeLocation: req.query.storeLocation as string | undefined, status: req.query.status as string | undefined })); } catch (e) { next(e); }
  };
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.get(req.params.id)); } catch (e) { next(e); }
  };
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json(await this.service.create(req.body)); } catch (e) { next(e); }
  };
  void = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.void(req.params.id)); } catch (e) { next(e); }
  };
}
