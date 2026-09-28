import { Router } from 'express';
import { GoodsReceivedNoteController } from './goods-received-note.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { CreateGRNSchema, RecordLineSchema, ListGRNQuerySchema } from './goods-received-note.validation';

export const grnRouter = Router();
const controller = new GoodsReceivedNoteController();

grnRouter.get('/', validateQuery(ListGRNQuerySchema), controller.list);
grnRouter.post('/', validateBody(CreateGRNSchema), controller.create);
grnRouter.get('/:id', controller.get);
grnRouter.post('/:id/lines', validateBody(RecordLineSchema), controller.recordGoodsReceivedNoteLine);
grnRouter.post('/:id/complete', controller.complete);
