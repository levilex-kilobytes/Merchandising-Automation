import { Request, Response, NextFunction } from 'express';
import { RegisterService } from './register.service';

export class RegisterController {
  constructor(private readonly service = new RegisterService()) {}

  listRegisters = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.listRegisters()); } catch (e) { next(e); }
  };

  listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.service.listSessions({
        storeLocation: req.query.storeLocation as string | undefined,
        businessDate: req.query.businessDate as string | undefined,
        status: req.query.status as string | undefined,
      }));
    } catch (e) { next(e); }
  };

  getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.getSession(req.params.id)); } catch (e) { next(e); }
  };

  openSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json(await this.service.openSession(req.body)); } catch (e) { next(e); }
  };

  closeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { countedTotal, signedOffBy, explanation } = req.body;
      res.json(await this.service.closeSession(req.params.id, Number(countedTotal), signedOffBy, explanation));
    } catch (e) { next(e); }
  };
}
