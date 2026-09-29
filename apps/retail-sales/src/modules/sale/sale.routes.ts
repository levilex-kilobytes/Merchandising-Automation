import { Router } from 'express';
import { SaleController } from './sale.controller';

export const saleRouter = Router();
const c = new SaleController();
saleRouter.get('/', c.list);
saleRouter.post('/', c.create);
saleRouter.get('/:id', c.get);
saleRouter.post('/:id/void', c.void);
