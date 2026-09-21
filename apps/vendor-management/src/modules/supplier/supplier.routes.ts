import { Router } from 'express';
import { SupplierController } from './supplier.controller';
import { validateBody, validateQuery } from '../../middleware/validate';
import { CreateSupplierSchema, UpdateSupplierSchema, ListSuppliersQuerySchema } from './supplier.validation';

export const supplierRouter = Router();
const controller = new SupplierController();

supplierRouter.get('/', validateQuery(ListSuppliersQuerySchema), controller.list);
supplierRouter.get('/:id', controller.get);
supplierRouter.post('/', validateBody(CreateSupplierSchema), controller.create);
supplierRouter.patch('/:id', validateBody(UpdateSupplierSchema), controller.update);
supplierRouter.delete('/:id', controller.deactivate);
