import { Router } from 'express';
import { TransferController } from './transfer.controller';

export const transferRouter = Router();
const c = new TransferController();

transferRouter.get('/', c.list);
transferRouter.post('/', c.create);
transferRouter.get('/:id', c.get);
transferRouter.post('/:id/dispatch', c.dispatch);
transferRouter.post('/:id/receive', c.receive);
