import { z } from 'zod';
import { CreatePurchaseOrderDto, ApprovePurchaseOrderDto, CancelPurchaseOrderDto, ListPurchaseOrdersQueryDto } from './purchase-order.types';

export const CreatePOSchema: z.ZodType<CreatePurchaseOrderDto> = z.object({
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

export const ApprovePOSchema: z.ZodType<ApprovePurchaseOrderDto> = z.object({
  approvedBy: z.string().min(1).max(255),
  note: z.string().optional(),
});

export const CancelPOSchema: z.ZodType<CancelPurchaseOrderDto> = z.object({
  reason: z.string().min(1),
});

export const ListPOQuerySchema: z.ZodType<ListPurchaseOrdersQueryDto> = z.object({
  status: z.enum(['draft', 'pending', 'approved', 'sent', 'received', 'closed', 'cancelled']).optional(),
  supplierId: z.string().uuid().optional(),
});
