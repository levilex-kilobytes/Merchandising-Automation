export type PickTaskStatus = 'pending' | 'completed';

export interface PickTask {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  fromBin: string;
  toLocation: string;
  status: PickTaskStatus;
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePickTaskDto {
  productCode: string;
  productName: string;
  quantity: number;
  fromBin: string;
  toLocation: string;
  notes?: string;
}
