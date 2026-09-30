import { PricingRepository } from './pricing.repository';
import { RetailPrice } from './pricing.types';
import { NotFoundError } from '@mfa/errors';

export class PricingService {
  constructor(private readonly repo = new PricingRepository()) {}
  async getPrice(code: string): Promise<RetailPrice> {
    const p = await this.repo.findByCode(code);
    if (!p) throw new NotFoundError(`No retail price for ${code}`);
    return p;
  }
  async list(): Promise<RetailPrice[]> { return this.repo.listAll(); }
}
