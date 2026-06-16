import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  ADMIN_SYNC_TOKEN: z.string().min(16),
  ADMIN_USERNAME: z.string().min(1).default("admin"),
  ADMIN_PASSWORD_HASH: z.string().optional().default(""),
  ADMIN_SESSION_SECRET: z.string().min(32).optional(),
  CRON_SECRET: z.string().optional().default(""),
  ERROR_TRACKING_DSN: z.string().optional().default(""),
  SYNC_ALERT_WEBHOOK_URL: z.string().url().optional(),
  API_FOOTBALL_KEY: z.string().optional().default(""),
  API_FOOTBALL_BASE_URL: z.string().url().default("https://v3.football.api-sports.io"),
  WORLDCUP2026_API_ENABLED: z.enum(["true", "false"]).default("false"),
  WORLDCUP2026_API_BASE_URL: z.string().url().default("https://worldcup26.ir"),
  WORLDCUP2026_API_TOKEN: z.string().optional().default(""),
  THESPORTSDB_KEY: z.string().optional().default(""),
  THESPORTSDB_BASE_URL: z.string().url().default("https://www.thesportsdb.com/api/v1/json"),
  EXTERNAL_API_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(21600),
  API_FOOTBALL_DAILY_LIMIT: z.coerce.number().int().positive().default(100)
}).transform((value) => ({
  ...value,
  ADMIN_SESSION_SECRET: value.ADMIN_SESSION_SECRET || value.ADMIN_SYNC_TOKEN,
  WORLDCUP2026_API_ENABLED: value.WORLDCUP2026_API_ENABLED === "true"
}));

export const env = serverEnvSchema.parse(process.env);

export type ServerEnv = z.infer<typeof serverEnvSchema>;
