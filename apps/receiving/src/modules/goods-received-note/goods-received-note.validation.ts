import { z } from 'zod';
import { CreateGoodsReceivedNoteDto, RecordLineDto, ListGRNQueryDto } from './goods-received-note.types';

export const CreateGRNSchema: z.ZodType<CreateGoodsReceivedNoteDto> = z.object({
  purchaseOrderId: z.string().uuid(),
  notes: z.string().optional(),
});

export const RecordLineSchema: z.ZodType<RecordLineDto> = z.object({
  productCode: z.string().min(1).max(100),
  receivedQty: z.number().int().nonnegative(),
  condition: z.enum(['good', 'damaged']),
  damagedQty: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export const ListGRNQuerySchema: z.ZodType<ListGRNQueryDto> = z.object({
  status: z.enum(['draft', 'completed']).optional(),
  purchaseOrderId: z.string().uuid().optional(),
});
