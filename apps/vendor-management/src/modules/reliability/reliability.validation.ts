import { z } from 'zod';
import { RecordDeliveryDto } from './reliability.types';

export const RecordDeliverySchema: z.ZodType<RecordDeliveryDto> = z.object({
  supplierId: z.string().uuid(),
  deliveredAt: z.string(),
  onTime: z.boolean(),
  hadShortage: z.boolean(),
  hadDamage: z.boolean(),
});
