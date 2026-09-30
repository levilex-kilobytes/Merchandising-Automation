export interface PhysicalCount {
  id: string;
  registerSessionId: string;
  cashCounted: number;
  cardCounted: number;
  otherCounted: number;
  countedBy: string | null;
  createdAt: Date;
}

export interface Reconciliation {
  id: string;
  registerSessionId: string;
  expectedTotal: number;
  countedTotal: number;
  overage: number;
  shortage: number;
  explanation: string | null;
  signedOffBy: string | null;
  createdAt: Date;
}

export interface RecordCountDto {
  cashCounted: number;
  cardCounted: number;
  otherCounted: number;
  countedBy?: string;
}
