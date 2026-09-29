import { Request, Response, NextFunction } from 'express';
import { JournalService } from './journal.service';

export class JournalController {
  constructor(private readonly service = new JournalService()) {}
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.service.list({
        referenceType: req.query.referenceType as string | undefined,
        referenceId: req.query.referenceId as string | undefined,
        fromDate: req.query.fromDate as string | undefined,
        toDate: req.query.toDate as string | undefined,
      }));
    } catch (e) { next(e); }
  };
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.get(req.params.id)); } catch (e) { next(e); }
  };
}
