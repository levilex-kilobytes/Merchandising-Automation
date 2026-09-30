import { Router } from 'express';
import { RegisterController } from './register.controller';

export const registerRouter = Router();
const c = new RegisterController();

registerRouter.get('/', c.listRegisters);
registerRouter.get('/sessions', c.listSessions);
registerRouter.post('/sessions', c.openSession);
registerRouter.get('/sessions/:id', c.getSession);
registerRouter.post('/sessions/:id/close', c.closeSession);
