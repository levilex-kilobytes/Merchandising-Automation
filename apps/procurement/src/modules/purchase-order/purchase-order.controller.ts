import { Request, Response, NextFunction } from 'express';
import { PurchaseOrderService } from './purchase-order.service';

export class PurchaseOrderController {
  constructor(private readonly service = new PurchaseOrderService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = (req as Request & { validatedQuery?: unknown }).validatedQuery ?? req.query;
      res.json(await this.service.listPurchaseOrders(filter as never));
    } catch (err) { next(err); }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.getPurchaseOrder(req.params.id)); } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.status(201).json(await this.service.createPurchaseOrder(req.body)); } catch (err) { next(err); }
  };

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.submitForApproval(req.params.id)); } catch (err) { next(err); }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.approvePurchaseOrder(req.params.id, req.body)); } catch (err) { next(err); }
  };

  send = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.sendPurchaseOrder(req.params.id)); } catch (err) { next(err); }
  };

  close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.closePurchaseOrder(req.params.id)); } catch (err) { next(err); }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await this.service.cancelPurchaseOrder(req.params.id, req.body)); } catch (err) { next(err); }
  };
}
