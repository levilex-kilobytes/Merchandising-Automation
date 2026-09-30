import { Request, Response, NextFunction } from 'express';
import { LocationService } from './location.service';

export class LocationController {
  constructor(private readonly service = new LocationService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { zone } = req.query;
      res.json(await this.service.list(zone as string | undefined));
    } catch (err) { next(err); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.get(req.params.code)); } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json(await this.service.create(req.body)); } catch (err) { next(err); }
  };
}
