export type TransferStatus = 'draft' | 'dispatched' | 'received';

export interface Transfer {
  id: string;
  fromLocation: string;
  toLocation: string;
  status: TransferStatus;
  notes: string | null;
  dispatchedAt: Date | null;
  receivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines?: TransferLine[];
}

export interface TransferLine {
  id: string;
  transferId: string;
  productCode: string;
  productName: string;
  quantity: number;
  createdAt: Date;
}

export interface CreateTransferDto {
  fromLocation: string;
  toLocation: string;
  notes?: string;
  lines: Array<{ productCode: string; productName: string; quantity: number }>;
}
