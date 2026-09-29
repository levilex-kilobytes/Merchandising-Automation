import { Router } from 'express';
import { ReportController } from './report.controller';
import { APController } from '../ap/ap.controller';

export const reportRouter = Router();
const c = new ReportController();
const ap = new APController();
reportRouter.get('/trial-balance', c.trialBalance);
reportRouter.get('/profit-and-loss', c.pnl);
reportRouter.get('/balance-sheet', c.balanceSheet);
reportRouter.get('/ap-aging', async (_req, res, next) => {
  try {
    const aging = await new (await import('../ap/ap.service')).APService().aging();
    res.json(aging);
  } catch (e) { next(e); }
});
