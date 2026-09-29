import { AccountRepository, Account } from './account.repository';
import { NotFoundError } from '@mfa/errors';

export class AccountService {
  constructor(private readonly repo = new AccountRepository()) {}
  async list(): Promise<Account[]> { return this.repo.list(); }
  async getByCode(code: string): Promise<Account> {
    const a = await this.repo.findByCode(code);
    if (!a) throw new NotFoundError(`Account ${code} not found`);
    return a;
  }
}
