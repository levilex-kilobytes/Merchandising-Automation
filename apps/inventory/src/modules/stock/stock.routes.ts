import { Router } from 'express';
import { StockController } from './stock.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { AdjustmentSchema, ListStockQuerySchema } from './stock.validation';

export const stockRouter = Router();
const controller = new StockController();

stockRouter.get('/', validateQuery(ListStockQuerySchema), controller.list);
stockRouter.post('/adjust', validateBody(AdjustmentSchema), controller.adjust);
stockRouter.get('/:productCode/:locationCode', controller.get);

export const movementRouter = Router();
movementRouter.get('/', controller.movements);

export const locationRouter = Router();
locationRouter.get('/', controller.locations);
