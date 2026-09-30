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
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
