import { describe, it, expect } from 'vitest';
import { safeJsonParse, cleanResult, stringifyError, delay } from './utils';

describe('AI Utilities', () => {
  describe('stringifyError', () => {
    it('returns default text for null or undefined', () => {
      expect(stringifyError(null)).toBe('Unknown Error');
      expect(stringifyError(undefined)).toBe('Unknown Error');
    });

    it('returns direct string for string errors', () => {
      expect(stringifyError('Custom Error Message')).toBe('Custom Error Message');
    });

    it('extracts message from Error instances', () => {
      expect(stringifyError(new Error('Something failed'))).toBe('Something failed');
    });

    it('stringifies object errors cleanly', () => {
      const objError = { code: 429, detail: 'Quota exceeded' };
      expect(stringifyError(objError)).toBe(JSON.stringify(objError));
    });
  });

  describe('cleanResult', () => {
    it('returns empty string for empty input', () => {
      expect(cleanResult('')).toBe('');
    });

    it('strips markdown code blocks', () => {
      const markdown = '```json\n{"key": "value"}\n```';
      expect(cleanResult(markdown)).toBe('{"key": "value"}');
    });

    it('strips leading and trailing quotes', () => {
      expect(cleanResult('"""Hello World"""')).toBe('Hello World');
      expect(cleanResult('"Quoted Text"')).toBe('Quoted Text');
    });

    it('preserves clean multiline text', () => {
      const multiline = 'Line 1\nLine 2';
      expect(cleanResult(multiline)).toBe(multiline);
    });
  });

  describe('safeJsonParse', () => {
    it('parses valid raw JSON directly', () => {
      const raw = '{"title": "Test Title", "count": 10}';
      const result = safeJsonParse<{ title: string; count: number }>(raw);
      expect(result).toEqual({ title: 'Test Title', count: 10 });
    });

    it('parses JSON embedded inside markdown code fence', () => {
      const wrapped = 'Here is the response:\n```json\n{"trends": ["tech", "ai"]}\n```';
      const result = safeJsonParse<{ trends: string[] }>(wrapped);
      expect(result).toEqual({ trends: ['tech', 'ai'] });
    });

    it('extracts outermost JSON object from noisy AI preamble and postamble', () => {
      const noisy = 'Sure, here is the requested output: {"status": "ok"} Thank you for asking!';
      const result = safeJsonParse<{ status: string }>(noisy);
      expect(result).toEqual({ status: 'ok' });
    });

    it('extracts outermost JSON array from noisy text', () => {
      const noisyArray = 'Here is the list: [{"id": 1}, {"id": 2}] Hope this helps.';
      const result = safeJsonParse<Array<{ id: number }>>(noisyArray);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('throws descriptive error on unrecoverable input', () => {
      expect(() => safeJsonParse('Just random plain text without brackets', 'TestContext')).toThrow(
        /Invalid JSON response from AI while processing TestContext/
      );
    });
  });

  describe('delay', () => {
    it('resolves after requested duration', async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });
  });
});
