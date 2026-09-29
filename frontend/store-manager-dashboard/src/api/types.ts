export interface Register {
  id: string;
  code: string;
  storeLocation: string;
  isActive: boolean;
  createdAt: string;
}

export type SessionStatus = 'open' | 'counted' | 'closed';

export interface RegisterSession {
  id: string;
  registerCode: string;
  storeLocation: string;
  businessDate: string;
  cashierId: string | null;
  status: SessionStatus;
  expectedTotal: number;
  countedTotal: number;
  difference: number;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpenSessionDto {
  registerCode: string;
  storeLocation: string;
  businessDate: string;
  cashierId?: string;
}

export interface RecordCountDto {
  cashCounted: number;
  cardCounted: number;
  otherCounted: number;
  countedBy?: string;
}

export interface CloseSessionDto {
  countedTotal: number;
  signedOffBy: string;
  explanation?: string;
}
