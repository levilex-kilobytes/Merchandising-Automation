import { Request, Response, NextFunction } from 'express';
import { PricingService } from './pricing.service';

export class PricingController {
  constructor(private readonly service = new PricingService()) {}
  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.list()); } catch (err) { next(err); }
  };
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.getPrice(req.params.productCode)); } catch (err) { next(err); }
  };
}
