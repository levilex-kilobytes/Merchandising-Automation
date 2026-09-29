import { Router } from 'express';
import { ReturnController } from './return.controller';

export const returnRouter = Router();
const c = new ReturnController();
returnRouter.get('/', c.list);
returnRouter.post('/', c.create);
returnRouter.get('/:id', c.get);
