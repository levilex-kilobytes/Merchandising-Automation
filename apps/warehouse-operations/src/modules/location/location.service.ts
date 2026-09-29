import { LocationRepository } from './location.repository';
import { Location, CreateLocationDto } from './location.types';
import { NotFoundError, ConflictError } from '@mfa/errors';

export class LocationService {
  constructor(private readonly repo = new LocationRepository()) {}

  async create(input: CreateLocationDto): Promise<Location> {
    const existing = await this.repo.findByCode(input.code);
    if (existing) throw new ConflictError(`Location ${input.code} already exists`);
    return this.repo.withTransaction((tx) => this.repo.create(tx, input));
  }

  async get(code: string): Promise<Location> {
    const loc = await this.repo.findByCode(code);
    if (!loc) throw new NotFoundError(`Location ${code} not found`);
    return loc;
  }

  async list(zone?: string): Promise<Location[]> {
    return this.repo.list(zone);
  }
}
