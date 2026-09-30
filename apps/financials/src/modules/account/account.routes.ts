import { Router } from 'express';
import { AccountController } from './account.controller';

export const accountRouter = Router();
const c = new AccountController();
accountRouter.get('/', c.list);
accountRouter.get('/:code', c.get);
