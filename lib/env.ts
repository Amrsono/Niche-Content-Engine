import { z } from 'zod';
import { logger } from './logger';

/**
 * Zod schema defining all environment variables used in Niche-Content-Engine.
 */
const envSchema = z.object({
  // AI Keys
  GROQ_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  POLLINATIONS_API_KEY: z.string().optional().default(''),

  // Social & Auth Credentials
  TIKTOK_CLIENT_KEY: z.string().optional().default(''),
  TIKTOK_CLIENT_SECRET: z.string().optional().default(''),
  INSTAGRAM_ACCESS_TOKEN: z.string().optional().default(''),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().optional().default(''),
  FACEBOOK_PAGE_ACCESS_TOKEN: z.string().optional().default(''),
  FACEBOOK_PAGE_ID: z.string().optional().default(''),
  TWITTER_API_KEY: z.string().optional().default(''),
  TWITTER_API_SECRET: z.string().optional().default(''),
  TWITTER_ACCESS_TOKEN: z.string().optional().default(''),
  TWITTER_ACCESS_TOKEN_SECRET: z.string().optional().default(''),

  // Storage, CMS & Cron
  REDIS_URL: z.string().optional().default(''),
  CRON_SECRET: z.string().optional().default(''),
  AFFILIATE_TAG: z.string().optional().default(''),
  WP_BASE_URL: z.string().optional().default(''),
  WP_APP_PASSWORD: z.string().optional().default(''),
  SANITY_PROJECT_ID: z.string().optional().default(''),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional().default(''),

  // Public / Next.js vars
  NEXT_PUBLIC_ADMIN_EMAILS: z.string().optional().default(''),
  NEXT_PUBLIC_APP_URL: z.string().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_URL: z.string().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_FB_APP_ID: z.string().optional().default(''),

  // Node runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  logger.error('Environment validation failed', 'ENV', error);
  // Fallback to defaults to prevent crashing in non-configured test/dev environments
  parsedEnv = envSchema.parse({});
}

export const env = parsedEnv;

/**
 * Validates whether essential keys are available for AI generation.
 */
export function getAvailableAIProviders(): { groq: boolean; gemini: boolean; openai: boolean } {
  return {
    groq: Boolean(env.GROQ_API_KEY),
    gemini: Boolean(env.GEMINI_API_KEY),
    openai: Boolean(env.OPENAI_API_KEY),
  };
}

/**
 * Checks if admin email authorization is configured and matches user email.
 */
export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const rawAdminEmails = process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? env.NEXT_PUBLIC_ADMIN_EMAILS ?? '';
  const adminList = rawAdminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminList.length === 0 && process.env.NODE_ENV === 'development') {
    return true;
  }
  return adminList.includes(email.trim().toLowerCase());
}
