import { Router } from 'express';
import { LocationController } from './location.controller';

export const locationRouter = Router();
const c = new LocationController();

locationRouter.get('/', c.list);
locationRouter.post('/', c.create);
locationRouter.get('/:code', c.get);
