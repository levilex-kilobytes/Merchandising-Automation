import { Router } from 'express';
import { stockRouter, movementRouter, locationRouter } from '../modules/stock/stock.routes';
import { config } from '../config';

export const apiRouter = Router();

apiRouter.get(config.HEALTH_CHECK_PATH.replace(config.API_PREFIX, ''), (_req, res) => {
  res.json({ status: 'ok', service: config.SERVICE_NAME });
});

apiRouter.use('/stock', stockRouter);
apiRouter.use('/movements', movementRouter);
apiRouter.use('/locations', locationRouter);
