import { Router } from 'express';
import { PurchaseOrderController } from './purchase-order.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { CreatePOSchema, ApprovePOSchema, CancelPOSchema, ListPOQuerySchema } from './purchase-order.validation';

export const purchaseOrderRouter = Router();
const controller = new PurchaseOrderController();

purchaseOrderRouter.get('/', validateQuery(ListPOQuerySchema), controller.list);
purchaseOrderRouter.post('/', validateBody(CreatePOSchema), controller.create);
purchaseOrderRouter.get('/:id', controller.get);
purchaseOrderRouter.post('/:id/submit', controller.submit);
purchaseOrderRouter.post('/:id/approve', validateBody(ApprovePOSchema), controller.approve);
purchaseOrderRouter.post('/:id/send', controller.send);
purchaseOrderRouter.post('/:id/close', controller.close);
purchaseOrderRouter.post('/:id/cancel', validateBody(CancelPOSchema), controller.cancel);
