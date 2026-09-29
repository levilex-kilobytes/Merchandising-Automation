import { Router } from 'express';
import { PricingController } from './pricing.controller';

export const pricingRouter = Router();
const c = new PricingController();
pricingRouter.get('/', c.list);
pricingRouter.get('/:productCode', c.get);
