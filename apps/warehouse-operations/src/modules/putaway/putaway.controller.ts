import { Request, Response, NextFunction } from 'express';
import { PutawayService } from './putaway.service';

export class PutawayController {
  constructor(private readonly service = new PutawayService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query;
      res.json(await this.service.list(status as any));
    } catch (err) { next(err); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.get(req.params.id)); } catch (err) { next(err); }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.completeTask(req.params.id)); } catch (err) { next(err); }
  };
}
