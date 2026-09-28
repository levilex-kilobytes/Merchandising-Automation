import { config as loadDotenv } from 'dotenv';
import path from 'path';
import { z } from 'zod';

loadDotenv({ path: path.resolve(__dirname, '../../.env') });

const EnvSchema = z.object({
  SERVICE_NAME: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
  GRPC_PORT: z.coerce.number().int().positive(),
  HTTP_HOST: z.string().min(1),
  GRPC_HOST: z.string().min(1),
  API_PREFIX: z.string().min(1),
  HEALTH_CHECK_PATH: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  EVENT_EXCHANGE: z.string().min(1),
  FEATURE_INVENTORY: z.enum(['enabled', 'disabled']),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
  OUTBOX_INTERVAL_MS: z.coerce.number().int().positive(),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().positive(),
  DEFAULT_LOCATION_CODE: z.string().min(1),
  LOW_STOCK_THRESHOLD: z.coerce.number().int().nonnegative(),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Configuration error:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}
export const config = parsed.data;
