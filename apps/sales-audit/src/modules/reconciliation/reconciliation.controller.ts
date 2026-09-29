import { Request, Response, NextFunction } from 'express';
import { ReconciliationService } from './reconciliation.service';

export class ReconciliationController {
  constructor(private readonly service = new ReconciliationService()) {}

  recordCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cashCounted, cardCounted, otherCounted, countedBy } = req.body;
      res.json(await this.service.recordCount(req.params.id, {
        cashCounted: Number(cashCounted),
        cardCounted: Number(cardCounted),
        otherCounted: Number(otherCounted),
        countedBy,
      }));
    } catch (e) { next(e); }
  };
}
