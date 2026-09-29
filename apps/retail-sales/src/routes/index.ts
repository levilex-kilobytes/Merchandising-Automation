import { Router } from 'express';
import { saleRouter } from '../modules/sale/sale.routes';
import { returnRouter } from '../modules/return/return.routes';
import { pricingRouter } from '../modules/pricing/pricing.routes';
import { config } from '../config';

export const apiRouter = Router();
apiRouter.get(config.HEALTH_CHECK_PATH.replace(config.API_PREFIX, ''), (_req, res) => {
  res.json({ status: 'ok', service: config.SERVICE_NAME });
});
apiRouter.use('/sales', saleRouter);
apiRouter.use('/returns', returnRouter);
apiRouter.use('/prices', pricingRouter);
