import { Router } from 'express';
import { supplierRouter } from '../modules/supplier/supplier.routes';
import { supplierProductRouter, productRouter, productLookupRouter } from '../modules/supplier-product/supplier-product.routes';
import { config } from '../config';

export const apiRouter = Router();

apiRouter.get(config.HEALTH_CHECK_PATH.replace(config.API_PREFIX, ''), (_req, res) => {
  res.json({ status: 'ok', service: config.SERVICE_NAME });
});

apiRouter.use('/suppliers/:supplierId/products', supplierProductRouter);
apiRouter.use('/suppliers', supplierRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/product-lookup', productLookupRouter);
