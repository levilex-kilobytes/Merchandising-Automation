import { Request, Response, NextFunction } from 'express';
import { AccountService } from './account.service';

export class AccountController {
  constructor(private readonly service = new AccountService()) {}
  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.list()); } catch (e) { next(e); }
  };
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.getByCode(req.params.code)); } catch (e) { next(e); }
  };
}
