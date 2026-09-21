import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { SupplierRow, toSupplier } from './supplier.model';
import { Supplier, CreateSupplierDto, UpdateSupplierDto, ListSuppliersQueryDto } from './supplier.types';

export class SupplierRepository {
  withTransaction = withTransaction;

  async create(tx: PoolClient, input: CreateSupplierDto): Promise<Supplier> {
    const { rows } = await tx.query<SupplierRow>(
      `INSERT INTO suppliers
        (name, legal_name, tax_id, status, email, phone,
         address_line1, address_line2, city, country,
         payment_terms, default_currency, notes)
       VALUES ($1,$2,$3,'active',$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        input.name,
        input.legalName ?? null,
        input.taxId ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.addressLine1 ?? null,
        input.addressLine2 ?? null,
        input.city ?? null,
        input.country,
        input.paymentTerms,
        input.defaultCurrency,
        input.notes ?? null,
      ],
    );
    return toSupplier(rows[0]);
  }

  async findById(id: string): Promise<Supplier | null> {
    const { rows } = await pool.query<SupplierRow>(
      `SELECT * FROM suppliers WHERE id = $1`,
      [id],
    );
    return rows[0] ? toSupplier(rows[0]) : null;
  }

  async findByName(name: string): Promise<Supplier | null> {
    const { rows } = await pool.query<SupplierRow>(
      `SELECT * FROM suppliers WHERE LOWER(name) = LOWER($1)`,
      [name],
    );
    return rows[0] ? toSupplier(rows[0]) : null;
  }

  async list(filter: ListSuppliersQueryDto): Promise<Supplier[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }
    if (filter.search) {
      params.push(`%${filter.search}%`);
      conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query<SupplierRow>(
      `SELECT * FROM suppliers ${where} ORDER BY name ASC`,
      params,
    );
    return rows.map(toSupplier);
  }

  async update(tx: PoolClient, id: string, patch: UpdateSupplierDto): Promise<Supplier> {
    const map: Record<string, string> = {
      name: 'name',
      legalName: 'legal_name',
      taxId: 'tax_id',
      email: 'email',
      phone: 'phone',
      addressLine1: 'address_line1',
      addressLine2: 'address_line2',
      city: 'city',
      country: 'country',
      paymentTerms: 'payment_terms',
      defaultCurrency: 'default_currency',
      notes: 'notes',
      status: 'status',
    };

    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [key, col] of Object.entries(map)) {
      const value = (patch as Record<string, unknown>)[key];
      if (value !== undefined) {
        values.push(value);
        sets.push(`${col} = $${values.length}`);
      }
    }
    if (sets.length === 0) {
      const { rows } = await tx.query<SupplierRow>(`SELECT * FROM suppliers WHERE id = $1`, [id]);
      return toSupplier(rows[0]);
    }
    values.push(id);
    const { rows } = await tx.query<SupplierRow>(
      `UPDATE suppliers SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );
    return toSupplier(rows[0]);
  }
}
