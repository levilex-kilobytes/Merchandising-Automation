import { Router } from 'express';
import { locationRouter } from '../modules/location/location.routes';
import { putawayRouter } from '../modules/putaway/putaway.routes';
import { pickingRouter } from '../modules/picking/picking.routes';
import { transferRouter } from '../modules/transfer/transfer.routes';
import { config } from '../config';

export const apiRouter = Router();

apiRouter.get(config.HEALTH_CHECK_PATH.replace(config.API_PREFIX, ''), (_req, res) => {
  res.json({ status: 'ok', service: config.SERVICE_NAME });
});

apiRouter.use('/locations', locationRouter);
apiRouter.use('/putaway-tasks', putawayRouter);
apiRouter.use('/pick-tasks', pickingRouter);
apiRouter.use('/transfers', transferRouter);
