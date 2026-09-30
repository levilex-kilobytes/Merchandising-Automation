import { Router } from 'express';
import { PickingController } from './picking.controller';

export const pickingRouter = Router();
const c = new PickingController();

pickingRouter.get('/', c.list);
pickingRouter.post('/', c.create);
pickingRouter.get('/:id', c.get);
pickingRouter.post('/:id/complete', c.complete);
