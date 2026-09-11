import { Router } from 'express';
import { SupplierProductController } from '../controllers/supplier-product.controller';
import { validateBody } from '../middleware/validate';
import { CreateSupplierProductSchema, UpdateSupplierProductSchema, ChangePriceSchema } from '../types/dto';

const controller = new SupplierProductController();

export const supplierProductRouter = Router({ mergeParams: true });
supplierProductRouter.get('/', controller.listBySupplier);
supplierProductRouter.get('/:productCode', controller.get);
supplierProductRouter.post('/', validateBody(CreateSupplierProductSchema), controller.add);

export const productRouter = Router();
productRouter.patch('/:id', validateBody(UpdateSupplierProductSchema), controller.update);
productRouter.post('/:id/change-price', validateBody(ChangePriceSchema), controller.changePrice);

export const productLookupRouter = Router();
productLookupRouter.get('/:productCode/suppliers', controller.listSuppliersForProduct);
productLookupRouter.get('/:supplierId/:productCode/price-history', controller.priceHistory);
