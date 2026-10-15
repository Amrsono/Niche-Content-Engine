import { z } from 'zod';

export const BatchRequestSchema = z.object({
  niche: z.string().optional().default('AI & Future Tech'),
  count: z.number().int().min(1).max(50).default(30),
  autoSocial: z.boolean().optional().default(true),
  autoIndex: z.boolean().optional().default(true),
});

export const ScraperRequestSchema = z.object({
  niche: z.string().optional().default('All Trends'),
  count: z.number().int().min(1).max(50).default(20),
  discoverOnly: z.boolean().optional().default(false),
});

export const IndexingRequestSchema = z.object({
  urls: z.array(z.string()).optional(),
  mode: z.enum(['custom', 'all', 'latest']).default('custom'),
});

export const SocialSignalRequestSchema = z.object({
  platform: z.enum(['instagram', 'twitter', 'tiktok', 'facebook']),
  slug: z.string().min(1, 'Slug is required'),
});

export const BatchSocialRequestSchema = z.object({
  slugs: z.array(z.string()).optional(),
  platforms: z.array(z.enum(['facebook', 'instagram', 'twitter', 'tiktok'])).optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

export const DiagnosticRequestSchema = z.object({
  model: z.string().min(1, 'Model name is required'),
});

export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues || [];
    const errorMsg = issues.length > 0
      ? issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      : result.error.message || 'Validation failed';
    return { success: false, error: errorMsg };
  }
  return { success: true, data: result.data };
}
