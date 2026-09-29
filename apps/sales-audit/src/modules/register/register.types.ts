export type SessionStatus = 'open' | 'counted' | 'closed';

export interface Register {
  id: string;
  code: string;
  storeLocation: string;
  isActive: boolean;
  createdAt: Date;
}

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
  openedAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpenSessionDto {
  registerCode: string;
  storeLocation: string;
  businessDate: string;
  cashierId?: string;
}
