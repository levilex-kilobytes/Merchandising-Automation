import { Request, Response, NextFunction } from 'express';
import { RegisterService } from '../register/register.service';

export class DiscrepancyController {
  constructor(private readonly service = new RegisterService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.service.listDiscrepancies({
        storeLocation: req.query.storeLocation as string | undefined,
        cashierId: req.query.cashierId as string | undefined,
      }));
    } catch (e) { next(e); }
  };
}
