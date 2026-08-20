import { describe, it, expect } from 'vitest';
import { isUserAdmin, getAvailableAIProviders, env } from './env';

describe('Environment Configuration & Validation', () => {
  describe('isUserAdmin', () => {
    it('returns false for null or undefined email', () => {
      expect(isUserAdmin(null)).toBe(false);
      expect(isUserAdmin(undefined)).toBe(false);
      expect(isUserAdmin('')).toBe(false);
    });

    it('identifies authorized admin emails correctly', () => {
      // Temporarily set admin emails on env config for test
      env.NEXT_PUBLIC_ADMIN_EMAILS = 'admin@example.com, developer@company.com';
      expect(isUserAdmin('admin@example.com')).toBe(true);
      expect(isUserAdmin('ADMIN@EXAMPLE.COM')).toBe(true); // case-insensitive
      expect(isUserAdmin('developer@company.com')).toBe(true);
      expect(isUserAdmin('unauthorized@domain.com')).toBe(false);
    });
  });

  describe('getAvailableAIProviders', () => {
    it('returns boolean flags for available providers', () => {
      const providers = getAvailableAIProviders();
      expect(typeof providers.groq).toBe('boolean');
      expect(typeof providers.gemini).toBe('boolean');
      expect(typeof providers.openai).toBe('boolean');
    });
  });
});
