import { Router } from 'express';
import { registerRouter } from '../modules/register/register.routes';
import { reconciliationRouter } from '../modules/reconciliation/reconciliation.routes';
import { discrepancyRouter } from '../modules/discrepancy/discrepancy.routes';
import { config } from '../config';

export const apiRouter = Router();

apiRouter.get(config.HEALTH_CHECK_PATH.replace(config.API_PREFIX, ''), (_req, res) => {
  res.json({ status: 'ok', service: config.SERVICE_NAME });
});

apiRouter.use('/registers', registerRouter);
apiRouter.use('/register-sessions', reconciliationRouter);
apiRouter.use('/discrepancies', discrepancyRouter);
