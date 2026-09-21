import { z } from 'zod';
import { CreateSupplierProductDto, UpdateSupplierProductDto, ChangePriceDto } from './supplier-product.types';

export const CreateSupplierProductSchema: z.ZodType<CreateSupplierProductDto> = z.object({
  productCode: z.string().min(1).max(100),
  productName: z.string().min(1).max(255),
  unitCost: z.number().nonnegative(),
  currency: z.string().length(3),
  leadTimeDays: z.number().int().nonnegative(),
  minOrderQty: z.number().int().positive(),
  validFrom: z.string().optional(),
});

export const UpdateSupplierProductSchema: z.ZodType<UpdateSupplierProductDto> = z.object({
  productName: z.string().min(1).max(255).optional(),
  unitCost: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
  minOrderQty: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const ChangePriceSchema: z.ZodType<ChangePriceDto> = z.object({
  newCost: z.number().nonnegative(),
  currency: z.string().length(3).optional(),
  effectiveFrom: z.string().optional(),
});
