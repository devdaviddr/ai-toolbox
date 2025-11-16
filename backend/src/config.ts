import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_SERVER: z.string().min(1, 'DB_SERVER is required'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  AZURE_CLIENT_ID: z.string().min(1, 'AZURE_CLIENT_ID is required'),
  AZURE_TENANT_ID: z.string().min(1, 'AZURE_TENANT_ID is required'),
  AZURE_AUDIENCE: z.string().min(1, 'AZURE_AUDIENCE is required'),
  AZURE_AUDIENCE_WITH_SCOPE: z.string().min(1, 'AZURE_AUDIENCE_WITH_SCOPE is required'),
  AZURE_ISSUER: z.string().url('AZURE_ISSUER must be a valid URL'),
});

export type Config = z.infer<typeof configSchema>;

export function validateConfig(): Config {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      throw new Error(`Configuration validation failed: ${errors}`);
    }
    throw error;
  }
}
