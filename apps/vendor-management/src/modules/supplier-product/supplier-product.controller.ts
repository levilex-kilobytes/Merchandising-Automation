import { Request, Response, NextFunction } from 'express';
import { SupplierProductService } from './supplier-product.service';

export class SupplierProductController {
  constructor(private readonly service = new SupplierProductService()) {}

  listBySupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.listBySupplier(req.params.supplierId)); } catch (err) { next(err); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { supplierId, productCode } = req.params;
      res.json(await this.service.getProduct(supplierId, productCode));
    } catch (err) { next(err); }
  };

  add = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json(await this.service.addProduct(req.params.supplierId, req.body)); } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.updateProduct(req.params.id, req.body)); } catch (err) { next(err); }
  };

  changePrice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { newCost, currency, effectiveFrom } = req.body;
      res.json(await this.service.changePrice(req.params.id, newCost, currency, effectiveFrom));
    } catch (err) { next(err); }
  };

  priceHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { supplierId, productCode } = req.params;
      res.json(await this.service.getPriceHistory(supplierId, productCode));
    } catch (err) { next(err); }
  };

  listSuppliersForProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.listSuppliersForProduct(req.params.productCode)); } catch (err) { next(err); }
  };
}
