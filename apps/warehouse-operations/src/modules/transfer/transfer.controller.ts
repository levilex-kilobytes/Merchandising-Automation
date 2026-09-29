import { Request, Response, NextFunction } from 'express';
import { TransferService } from './transfer.service';

export class TransferController {
  constructor(private readonly service = new TransferService()) {}

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
    try { res.status(201).json(await this.service.create(req.body)); } catch (err) { next(err); }
  };

  dispatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.dispatch(req.params.id)); } catch (err) { next(err); }
  };

  receive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.receive(req.params.id)); } catch (err) { next(err); }
  };
}
