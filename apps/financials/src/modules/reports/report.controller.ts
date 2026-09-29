import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';

export class ReportController {
  constructor(private readonly service = new ReportService()) {}
  trialBalance = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.trialBalance()); } catch (e) { next(e); }
  };
  pnl = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.profitAndLoss()); } catch (e) { next(e); }
  };
  balanceSheet = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.balanceSheet()); } catch (e) { next(e); }
  };
}
