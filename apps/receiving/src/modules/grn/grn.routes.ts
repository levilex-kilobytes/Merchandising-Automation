import { Router } from 'express';
import { GRNController } from './grn.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { CreateGRNSchema, RecordLineSchema, ListGRNQuerySchema } from './grn.validation';

export const grnRouter = Router();
const controller = new GRNController();

grnRouter.get('/', validateQuery(ListGRNQuerySchema), controller.list);
grnRouter.post('/', validateBody(CreateGRNSchema), controller.create);
grnRouter.get('/:id', controller.get);
grnRouter.post('/:id/lines', validateBody(RecordLineSchema), controller.recordLine);
grnRouter.post('/:id/complete', controller.complete);
