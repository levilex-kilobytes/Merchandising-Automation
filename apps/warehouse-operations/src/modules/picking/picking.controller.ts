import { Request, Response, NextFunction } from 'express';
import { PickingService } from './picking.service';

export class PickingController {
  constructor(private readonly service = new PickingService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query;
      res.json(await this.service.list(status as any));
    } catch (err) { next(err); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.get(req.params.id)); } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json(await this.service.createTask(req.body)); } catch (err) { next(err); }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.completeTask(req.params.id)); } catch (err) { next(err); }
  };
}
