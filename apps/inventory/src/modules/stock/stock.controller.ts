import { Request, Response, NextFunction } from 'express';
import { StockService } from './stock.service';

export class StockController {
  constructor(private readonly service = new StockService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = (req as Request & { validatedQuery?: unknown }).validatedQuery ?? req.query;
      res.json(await this.service.listStock(filter as never));
    } catch (err) { next(err); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productCode, locationCode } = req.params;
      res.json(await this.service.getStockItem(productCode, locationCode));
    } catch (err) { next(err); }
  };

  adjust = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.adjustStock(req.body)); } catch (err) { next(err); }
  };

  movements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productCode, locationCode } = req.query;
      res.json(await this.service.listMovements(productCode as string | undefined, locationCode as string | undefined));
    } catch (err) { next(err); }
  };

  locations = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.listLocations()); } catch (err) { next(err); }
  };
}
