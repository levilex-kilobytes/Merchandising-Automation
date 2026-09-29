import { Request, Response, NextFunction } from 'express';
import { APService } from './ap.service';

export class APController {
  constructor(private readonly service = new APService()) {}
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.service.list({
        supplierId: req.query.supplierId as string | undefined,
        status: req.query.status as string | undefined,
      }));
    } catch (e) { next(e); }
  };
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.get(req.params.id)); } catch (e) { next(e); }
  };
  pay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const amount = Number(req.body?.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        res.status(400).json({ error: { code: 'VALIDATION', message: 'amount must be a positive number' } });
        return;
      }
      res.json(await this.service.pay(req.params.id, amount));
    } catch (e) { next(e); }
  };
}
