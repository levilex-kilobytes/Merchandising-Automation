import { RegisterRepository } from './register.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { Register, RegisterSession, OpenSessionDto } from './register.types';
import { ConflictError, NotFoundError } from '@mfa/errors';

export class RegisterService {
  constructor(
    private readonly repo = new RegisterRepository(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async listRegisters(): Promise<Register[]> {
    return this.repo.listRegisters();
  }

  async openSession(input: OpenSessionDto): Promise<RegisterSession> {
    const reg = await this.repo.findRegister(input.registerCode);
    if (!reg) throw new NotFoundError(`Register ${input.registerCode} not found`);

    const existing = await this.repo.findSessionByRegisterAndDate(input.registerCode, input.businessDate);
    if (existing) throw new ConflictError(`Session for ${input.registerCode} on ${input.businessDate} already exists`);

    return this.repo.withTransaction(async (tx) => this.repo.openSession(tx, input));
  }

  async getSession(id: string): Promise<RegisterSession> {
    const s = await this.repo.findSessionById(id);
    if (!s) throw new NotFoundError(`Register session ${id} not found`);
    return s;
  }

  async listSessions(filter: { storeLocation?: string; businessDate?: string; status?: string }): Promise<RegisterSession[]> {
    return this.repo.listSessions(filter);
  }

  async recordSale(input: { storeLocation: string; registerCode: string; businessDate: string; amount: number }): Promise<RegisterSession> {
    return this.repo.withTransaction(async (tx) => {
      let session = await this.repo.findSessionByRegisterAndDate(input.registerCode, input.businessDate, tx);
      if (!session) {
        session = await this.repo.openSession(tx, {
          registerCode: input.registerCode,
          storeLocation: input.storeLocation,
          businessDate: input.businessDate,
        });
      }
      if (session.status !== 'open') {
        throw new ConflictError(`Session for ${input.registerCode} is ${session.status}, cannot record sale`);
      }
      return this.repo.addExpectedTotal(tx, session.id, input.amount);
    });
  }

  async closeSession(id: string, countedTotal: number, signedOffBy: string, explanation?: string): Promise<RegisterSession> {
    const session = await this.getSession(id);
    if (session.status === 'closed') throw new ConflictError('Session already closed');
    if (session.status !== 'counted') throw new ConflictError('Session must be counted before closing');

    const difference = Number((countedTotal - session.expectedTotal).toFixed(2));
    if (difference !== 0 && !explanation?.trim()) {
      throw new ConflictError('Explanation required for overage or shortage');
    }

    return this.repo.withTransaction(async (tx) => {
      const closed = await this.repo.markClosed(tx, id);

      await this.outbox.enqueue(tx, {
        eventType: 'sales-audit.register.closed',
        aggregateId: closed.id,
        payload: {
          registerSessionId: closed.id,
          registerCode: closed.registerCode,
          storeLocation: closed.storeLocation,
          businessDate: closed.businessDate,
          expectedTotal: closed.expectedTotal,
          countedTotal: closed.countedTotal,
          difference: closed.difference,
          signedOffBy,
          explanation: explanation ?? null,
          closedAt: new Date().toISOString(),
        },
      });

      return closed;
    });
  }

  async listDiscrepancies(filter: { storeLocation?: string; cashierId?: string }): Promise<RegisterSession[]> {
    return this.repo.listDiscrepancies(filter);
  }
}
