import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { LocationRow, toLocation } from './location.model';
import { Location, CreateLocationDto } from './location.types';

export class LocationRepository {
  withTransaction = withTransaction;

  async create(tx: PoolClient, input: CreateLocationDto): Promise<Location> {
    const { rows } = await tx.query<LocationRow>(
      `INSERT INTO locations (code, zone, aisle, rack, shelf, bin, capacity)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [input.code, input.zone, input.aisle, input.rack, input.shelf, input.bin, input.capacity ?? 1000],
    );
    return toLocation(rows[0]);
  }

  async findByCode(code: string, tx?: PoolClient): Promise<Location | null> {
    const client = tx ?? pool;
    const { rows } = await client.query<LocationRow>(`SELECT * FROM locations WHERE code = $1`, [code]);
    return rows[0] ? toLocation(rows[0]) : null;
  }

  async list(zone?: string): Promise<Location[]> {
    const where = zone ? 'WHERE zone = $1' : '';
    const params = zone ? [zone] : [];
    const { rows } = await pool.query<LocationRow>(`SELECT * FROM locations ${where} ORDER BY code`, params);
    return rows.map(toLocation);
  }

  async incrementUsed(tx: PoolClient, code: string, delta: number): Promise<Location> {
    const { rows } = await tx.query<LocationRow>(
      `UPDATE locations SET used = used + $1, updated_at = NOW()
       WHERE code = $2 AND used + $1 >= 0 AND used + $1 <= capacity
       RETURNING *`,
      [delta, code],
    );
    if (!rows[0]) throw new Error(`Cannot update location ${code}: capacity or negative constraint`);
    return toLocation(rows[0]);
  }

  async findAvailableBin(tx: PoolClient, requiredCapacity: number): Promise<Location | null> {
    const { rows } = await tx.query<LocationRow>(
      `SELECT * FROM locations
       WHERE is_active = TRUE AND capacity - used >= $1
       ORDER BY used ASC, code ASC LIMIT 1`,
      [requiredCapacity],
    );
    return rows[0] ? toLocation(rows[0]) : null;
  }

  async findFirstActive(tx: PoolClient): Promise<Location | null> {
    const { rows } = await tx.query<LocationRow>(
      `SELECT * FROM locations WHERE is_active = TRUE ORDER BY code LIMIT 1`,
    );
    return rows[0] ? toLocation(rows[0]) : null;
  }
}
