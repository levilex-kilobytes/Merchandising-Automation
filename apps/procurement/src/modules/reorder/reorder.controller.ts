import { Request, Response, NextFunction } from 'express';
import { ReorderService } from './reorder.service';

export class ReorderController {
  constructor(private readonly service = new ReorderService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query;
      res.json(await this.service.listSuggestions(status as string | undefined));
    } catch (err) { next(err); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.getSuggestion(req.params.id)); } catch (err) { next(err); }
  };

  dismiss = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.dismiss(req.params.id)); } catch (err) { next(err); }
  };
}
