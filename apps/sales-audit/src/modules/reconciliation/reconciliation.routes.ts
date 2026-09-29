import { Router } from 'express';
import { ReconciliationController } from './reconciliation.controller';

export const reconciliationRouter = Router();
const c = new ReconciliationController();
reconciliationRouter.post('/sessions/:id/count', c.recordCount);
