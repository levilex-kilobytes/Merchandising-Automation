import { Router } from 'express';
import { purchaseOrderRouter } from '../modules/purchase-order/purchase-order.routes';
import { reorderRouter } from '../modules/reorder/reorder.routes';
import { config } from '../config';

export const apiRouter = Router();

apiRouter.get(config.HEALTH_CHECK_PATH.replace(config.API_PREFIX, ''), (_req, res) => {
  res.json({ status: 'ok', service: config.SERVICE_NAME });
});

apiRouter.use('/purchase-orders', purchaseOrderRouter);
apiRouter.use('/reorder-suggestions', reorderRouter);
