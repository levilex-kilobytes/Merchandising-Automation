import { Register, RegisterSession } from './register.types';

export interface RegisterRow {
  id: string; code: string; store_location: string; is_active: boolean; created_at: Date;
}
export interface SessionRow {
  id: string; register_code: string; store_location: string; business_date: Date;
  cashier_id: string | null; status: string;
  expected_total: string; counted_total: string; difference: string;
  opened_at: Date; closed_at: Date | null; created_at: Date; updated_at: Date;
}

export function toRegister(r: RegisterRow): Register {
  return { id: r.id, code: r.code, storeLocation: r.store_location, isActive: r.is_active, createdAt: r.created_at };
}

export function toSession(r: SessionRow): RegisterSession {
  return {
    id: r.id, registerCode: r.register_code, storeLocation: r.store_location,
    businessDate: r.business_date instanceof Date ? r.business_date.toISOString().slice(0, 10) : String(r.business_date),
    cashierId: r.cashier_id, status: r.status as RegisterSession['status'],
    expectedTotal: Number(r.expected_total), countedTotal: Number(r.counted_total),
    difference: Number(r.difference),
    openedAt: r.opened_at, closedAt: r.closed_at, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}
