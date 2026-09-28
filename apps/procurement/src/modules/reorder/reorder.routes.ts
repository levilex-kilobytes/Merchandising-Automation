import { Router } from 'express';
import { ReorderController } from './reorder.controller';

export const reorderRouter = Router();
const c = new ReorderController();

reorderRouter.get('/', c.list);
reorderRouter.get('/:id', c.get);
reorderRouter.post('/:id/dismiss', c.dismiss);
