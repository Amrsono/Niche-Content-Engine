import { z } from 'zod';

export const BatchRequestSchema = z.object({
  niche: z.string().min(1, 'Niche is required'),
  count: z.number().int().min(1).max(20).default(5),
});

export const ScraperRequestSchema = z.object({
  niche: z.string().optional().default('All Trends'),
});

export const IndexingRequestSchema = z.object({
  urls: z.array(z.string()).optional(),
  mode: z.enum(['custom', 'all', 'latest']).default('custom'),
});

export const SocialSignalRequestSchema = z.object({
  platform: z.enum(['instagram', 'twitter', 'tiktok', 'facebook']),
  slug: z.string().min(1, 'Slug is required'),
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
