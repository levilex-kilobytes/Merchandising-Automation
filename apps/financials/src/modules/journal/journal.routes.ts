import { Router } from 'express';
import { JournalController } from './journal.controller';

export const journalRouter = Router();
const c = new JournalController();
journalRouter.get('/', c.list);
journalRouter.get('/:id', c.get);
