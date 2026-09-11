import { z } from 'zod';

export const CreateSupplierSchema = z.object({
  name: z.string().min(2).max(255),
  legalName: z.string().max(255).optional(),
  taxId: z.string().max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100),
  paymentTerms: z.enum(['COD', 'NET_15', 'NET_30', 'NET_60', 'NET_90']),
  defaultCurrency: z.string().length(3),
  notes: z.string().optional(),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'blacklisted']).optional(),
});

export const ListSuppliersQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'blacklisted']).optional(),
  search: z.string().optional(),
});

export const CreateSupplierProductSchema = z.object({
  productCode: z.string().min(1).max(100),
  productName: z.string().min(1).max(255),
  unitCost: z.number().nonnegative(),
  currency: z.string().length(3),
  leadTimeDays: z.number().int().nonnegative(),
  minOrderQty: z.number().int().positive(),
  validFrom: z.string().optional(),
});

export const UpdateSupplierProductSchema = z.object({
  productName: z.string().min(1).max(255).optional(),
  unitCost: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
  minOrderQty: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const ChangePriceSchema = z.object({
  newCost: z.number().nonnegative(),
  currency: z.string().length(3).optional(),
  effectiveFrom: z.string().optional(),
});

export const RecordDeliverySchema = z.object({
  supplierId: z.string().uuid(),
  deliveredAt: z.string(),
  onTime: z.boolean(),
  hadShortage: z.boolean(),
  hadDamage: z.boolean(),
});

export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
export type ListSuppliersQuery = z.infer<typeof ListSuppliersQuerySchema>;
export type CreateSupplierProductInput = z.infer<typeof CreateSupplierProductSchema>;
export type UpdateSupplierProductInput = z.infer<typeof UpdateSupplierProductSchema>;
export type ChangePriceInput = z.infer<typeof ChangePriceSchema>;
export type RecordDeliveryInput = z.infer<typeof RecordDeliverySchema>;
