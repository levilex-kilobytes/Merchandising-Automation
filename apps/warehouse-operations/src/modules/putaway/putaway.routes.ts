import { Router } from 'express';
import { PutawayController } from './putaway.controller';

export const putawayRouter = Router();
const c = new PutawayController();

putawayRouter.get('/', c.list);
putawayRouter.get('/:id', c.get);
putawayRouter.post('/:id/complete', c.complete);
