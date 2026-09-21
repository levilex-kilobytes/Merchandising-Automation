import { z } from 'zod';
import { CreateSupplierDto, UpdateSupplierDto, ListSuppliersQueryDto } from './supplier.types';

export const CreateSupplierSchema: z.ZodType<CreateSupplierDto> = z.object({
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

export const UpdateSupplierSchema: z.ZodType<UpdateSupplierDto> = z.object({
  name: z.string().min(2).max(255).optional(),
  legalName: z.string().max(255).optional(),
  taxId: z.string().max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  paymentTerms: z.enum(['COD', 'NET_15', 'NET_30', 'NET_60', 'NET_90']).optional(),
  defaultCurrency: z.string().length(3).optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'blacklisted']).optional(),
});

export const ListSuppliersQuerySchema: z.ZodType<ListSuppliersQueryDto> = z.object({
  status: z.enum(['active', 'inactive', 'blacklisted']).optional(),
  search: z.string().optional(),
});
