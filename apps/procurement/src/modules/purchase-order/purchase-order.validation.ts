import { z } from 'zod';
import { CreatePODto, ApprovePODto, CancelPODto, ListPOQueryDto } from './purchase-order.types';

export const CreatePOSchema: z.ZodType<CreatePODto> = z.object({
  supplierId: z.string().uuid(),
  currency: z.string().length(3),
  expectedDate: z.string(),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        productCode: z.string().min(1).max(100),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const ApprovePOSchema: z.ZodType<ApprovePODto> = z.object({
  approvedBy: z.string().min(1).max(255),
  note: z.string().optional(),
});

export const CancelPOSchema: z.ZodType<CancelPODto> = z.object({
  reason: z.string().min(1),
});

export const ListPOQuerySchema: z.ZodType<ListPOQueryDto> = z.object({
  status: z.enum(['draft', 'pending', 'approved', 'sent', 'received', 'closed', 'cancelled']).optional(),
  supplierId: z.string().uuid().optional(),
});
