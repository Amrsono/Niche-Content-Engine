import { describe, it, expect } from 'vitest';
import { isTokenExpired } from './token';

describe('TikTok Token Manager', () => {
  describe('isTokenExpired', () => {
    it('returns true if expiration timestamp is in the past', () => {
      const pastTime = Date.now() - 10000;
      expect(isTokenExpired(pastTime)).toBe(true);
    });

    it('returns true if expiration is within the 5-minute buffer', () => {
      const nearFutureTime = Date.now() + 2 * 60 * 1000; // 2 mins remaining
      expect(isTokenExpired(nearFutureTime)).toBe(true);
    });

    it('returns false if expiration is safely beyond the buffer', () => {
      const farFutureTime = Date.now() + 60 * 60 * 1000; // 1 hour remaining
      expect(isTokenExpired(farFutureTime)).toBe(false);
    });
  });
});
