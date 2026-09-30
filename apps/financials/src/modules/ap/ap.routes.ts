import { Router } from 'express';
import { APController } from './ap.controller';

export const apRouter = Router();
const c = new APController();
apRouter.get('/', c.list);
apRouter.get('/:id', c.get);
apRouter.post('/:id/pay', c.pay);
