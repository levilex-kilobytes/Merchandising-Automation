import { Router } from 'express';
import { DiscrepancyController } from './discrepancy.controller';

export const discrepancyRouter = Router();
const c = new DiscrepancyController();
discrepancyRouter.get('/', c.list);
