import { Transfer, TransferLine } from './transfer.types';

export interface TransferRow {
  id: string;
  from_location: string;
  to_location: string;
  status: string;
  notes: string | null;
  dispatched_at: Date | null;
  received_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TransferLineRow {
  id: string;
  transfer_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  created_at: Date;
}

export function toTransfer(row: TransferRow, lines?: TransferLineRow[]): Transfer {
  return {
    id: row.id,
    fromLocation: row.from_location,
    toLocation: row.to_location,
    status: row.status as Transfer['status'],
    notes: row.notes,
    dispatchedAt: row.dispatched_at,
    receivedAt: row.received_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: lines?.map(toTransferLine),
  };
}

export function toTransferLine(row: TransferLineRow): TransferLine {
  return {
    id: row.id,
    transferId: row.transfer_id,
    productCode: row.product_code,
    productName: row.product_name,
    quantity: row.quantity,
    createdAt: row.created_at,
  };
}
