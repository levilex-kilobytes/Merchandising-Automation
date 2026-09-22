import { z } from 'zod';
import { AdjustmentDto, ListStockQueryDto } from './stock.types';

export const AdjustmentSchema: z.ZodType<AdjustmentDto> = z.object({
  productCode: z.string().min(1).max(100),
  locationCode: z.string().min(1).max(50),
  delta: z.number().int(),
  reason: z.string().min(1),
});

export const ListStockQuerySchema: z.ZodType<ListStockQueryDto> = z.object({
  productCode: z.string().optional(),
  locationCode: z.string().optional(),
  lowOnly: z.coerce.boolean().optional(),
});
