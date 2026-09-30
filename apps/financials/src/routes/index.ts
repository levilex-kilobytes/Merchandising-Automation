import { Router } from 'express';
import { accountRouter } from '../modules/account/account.routes';
import { journalRouter } from '../modules/journal/journal.routes';
import { apRouter } from '../modules/ap/ap.routes';
import { reportRouter } from '../modules/reports/report.routes';
import { config } from '../config';

export const apiRouter = Router();
apiRouter.get(config.HEALTH_CHECK_PATH.replace(config.API_PREFIX, ''), (_req, res) => {
  res.json({ status: 'ok', service: config.SERVICE_NAME });
});
apiRouter.use('/accounts', accountRouter);
apiRouter.use('/journal-entries', journalRouter);
apiRouter.use('/supplier-bills', apRouter);
apiRouter.use('/reports', reportRouter);
