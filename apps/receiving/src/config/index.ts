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
  FEATURE_RECEIVING: z.enum(['enabled', 'disabled']),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
  OUTBOX_INTERVAL_MS: z.coerce.number().int().positive(),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().positive(),
  PROCUREMENT_GRPC_URL: z.string().min(1),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuration error — missing or invalid environment variables:');
  const issues = parsed.error.flatten().fieldErrors;
  for (const [key, errors] of Object.entries(issues)) {
    console.error(`  ${key}: ${errors?.join(', ')}`);
  }
  console.error('Check apps/receiving/.env');
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
