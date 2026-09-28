import { Request, Response, NextFunction } from 'express';
import { GoodsReceivedNoteService } from './goods-received-note.service';

export class GoodsReceivedNoteController {
  constructor(private readonly service = new GoodsReceivedNoteService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = (req as Request & { validatedQuery?: unknown }).validatedQuery ?? req.query;
      res.json(await this.service.listGoodsReceivedNotes(filter as never));
    } catch (err) { next(err); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.getGoodsReceivedNote(req.params.id)); } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json(await this.service.createGoodsReceivedNote(req.body)); } catch (err) { next(err); }
  };

  recordGoodsReceivedNoteLine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.recordGoodsReceivedNoteLine(req.params.id, req.body)); } catch (err) { next(err); }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.completeGoodsReceivedNote(req.params.id)); } catch (err) { next(err); }
  };
}
