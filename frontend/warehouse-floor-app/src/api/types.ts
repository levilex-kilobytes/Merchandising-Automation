export interface Location {
  id: string;
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  capacity: number;
  used: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'pending' | 'completed';

export interface PutawayTask {
  id: string;
  goodsReceivedNoteId: string;
  productCode: string;
  productName: string;
  quantity: number;
  assignedBin: string;
  status: TaskStatus;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PickTask {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  fromBin: string;
  toLocation: string;
  status: TaskStatus;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TransferStatus = 'draft' | 'dispatched' | 'received';

export interface Transfer {
  id: string;
  fromLocation: string;
  toLocation: string;
  status: TransferStatus;
  notes: string | null;
  dispatchedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: TransferLine[];
}

export interface TransferLine {
  id: string;
  transferId: string;
  productCode: string;
  productName: string;
  quantity: number;
  createdAt: string;
}

export interface CreateTransferDto {
  fromLocation: string;
  toLocation: string;
  notes?: string;
  lines: Array<{ productCode: string; productName: string; quantity: number }>;
}

export interface BinWithQuantity {
  location: Location;
  quantity: number;
}

export interface ZoneSummary {
  zone: string;
  totalBins: number;
  usedBins: number;
  capacity: number;
  used: number;
  utilizationPct: number;
  nearFull: number;
  empty: number;
}
