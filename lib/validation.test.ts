import { describe, it, expect } from 'vitest';
import {
  BatchRequestSchema,
  ScraperRequestSchema,
  IndexingRequestSchema,
  SocialSignalRequestSchema,
  DiagnosticRequestSchema,
  validateRequestBody,
} from './validation';

describe('API Input Validation (lib/validation.ts)', () => {
  describe('BatchRequestSchema', () => {
    it('validates correct batch payload', () => {
      const result = validateRequestBody(BatchRequestSchema, { niche: 'SaaS AI', count: 5 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.niche).toBe('SaaS AI');
        expect(result.data.count).toBe(5);
      }
    });

    it('rejects empty niche string', () => {
      const result = validateRequestBody(BatchRequestSchema, { niche: '', count: 5 });
      expect(result.success).toBe(false);
    });

    it('rejects count higher than 20 or lower than 1', () => {
      const high = validateRequestBody(BatchRequestSchema, { niche: 'Tech', count: 50 });
      const low = validateRequestBody(BatchRequestSchema, { niche: 'Tech', count: 0 });
      expect(high.success).toBe(false);
      expect(low.success).toBe(false);
    });
  });

  describe('ScraperRequestSchema', () => {
    it('applies default niche when empty', () => {
      const result = validateRequestBody(ScraperRequestSchema, {});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.niche).toBe('All Trends');
      }
    });
  });

  describe('IndexingRequestSchema', () => {
    it('validates custom mode with array of URLs', () => {
      const result = validateRequestBody(IndexingRequestSchema, {
        mode: 'custom',
        urls: ['https://example.com/blog/post-1', 'https://example.com/blog/post-2'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid mode name', () => {
      const result = validateRequestBody(IndexingRequestSchema, { mode: 'invalid_mode' });
      expect(result.success).toBe(false);
    });
  });

  describe('SocialSignalRequestSchema', () => {
    it('validates platform and slug', () => {
      const result = validateRequestBody(SocialSignalRequestSchema, {
        platform: 'twitter',
        slug: 'ai-trends-2026',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid social platform', () => {
      const result = validateRequestBody(SocialSignalRequestSchema, {
        platform: 'myspace',
        slug: 'post-1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('DiagnosticRequestSchema', () => {
    it('validates model string', () => {
      const result = validateRequestBody(DiagnosticRequestSchema, { model: 'gemini-2.0-flash' });
      expect(result.success).toBe(true);
    });

    it('rejects missing model', () => {
      const result = validateRequestBody(DiagnosticRequestSchema, {});
      expect(result.success).toBe(false);
    });
  });
});
