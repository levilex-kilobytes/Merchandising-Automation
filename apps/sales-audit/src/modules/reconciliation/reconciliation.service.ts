import { ReconciliationRepository } from './reconciliation.repository';
import { RegisterRepository } from '../register/register.repository';
import { RecordCountDto } from './reconciliation.types';
import { RegisterSession } from '../register/register.types';
import { NotFoundError } from '@mfa/errors';

export class ReconciliationService {
  constructor(
    private readonly repo = new ReconciliationRepository(),
    private readonly registers = new RegisterRepository(),
  ) {}

  async recordCount(sessionId: string, input: RecordCountDto): Promise<RegisterSession> {
    const session = await this.registers.findSessionById(sessionId);
    if (!session) throw new NotFoundError(`Register session ${sessionId} not found`);

    const countedTotal = Number((input.cashCounted + input.cardCounted + input.otherCounted).toFixed(2));

    return this.repo.withTransaction(async (tx) => {
      await this.repo.recordCount(tx, {
        registerSessionId: sessionId,
        cashCounted: input.cashCounted,
        cardCounted: input.cardCounted,
        otherCounted: input.otherCounted,
        countedBy: input.countedBy ?? null,
      });
      return this.registers.updateAfterCount(tx, sessionId, countedTotal);
    });
  }
}
