import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateHashtags, generateSocialCaption } from './captions';
import * as dispatcherModule from '../ai/dispatcher';

vi.mock('../ai/dispatcher', () => {
  return {
    callAIWithFallback: vi.fn(),
  };
});

describe('Social Captions Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates hashtags from article title and content', async () => {
    vi.mocked(dispatcherModule.callAIWithFallback).mockResolvedValueOnce({
      text: '#automation #nextjs #coding',
    });

    const tags = await generateHashtags('Next.js 16 Overview', 'Here is content detailing Next.js 16');
    expect(tags).toBe('#automation #nextjs #coding');
  });

  it('returns fallback hashtags if dispatcher throws', async () => {
    vi.mocked(dispatcherModule.callAIWithFallback).mockRejectedValueOnce(new Error('Network error'));

    const tags = await generateHashtags('Any Title', 'Any Content');
    expect(tags).toContain('#niche');
  });

  it('generates optimized caption for Twitter with link and tags', async () => {
    vi.mocked(dispatcherModule.callAIWithFallback)
      .mockResolvedValueOnce({ text: '#ai #tech' }) // hashtags call
      .mockResolvedValueOnce({ text: 'Check out the newest breakthrough in AI! #ai #tech' }); // caption call

    const caption = await generateSocialCaption(
      'twitter',
      'AI Breakthrough 2026',
      'Summary of the breakthrough...',
      'https://example.com/blog/ai-breakthrough'
    );

    expect(caption).toContain('Check out the newest');
  });

  it('generates formatted caption for Instagram and appends hashtags if missing', async () => {
    vi.mocked(dispatcherModule.callAIWithFallback)
      .mockResolvedValueOnce({ text: '#instagram #growth #viral' })
      .mockResolvedValueOnce({ text: '🚀 High-energy Instagram caption hook.\n\nLink in Bio!' });

    const caption = await generateSocialCaption(
      'instagram',
      'Viral Growth Hacks',
      'Article body...'
    );

    expect(caption).toContain('Link in Bio');
    expect(caption).toContain('#instagram');
  });

  it('handles caption generation failure gracefully with fallback text', async () => {
    vi.mocked(dispatcherModule.callAIWithFallback).mockRejectedValue(new Error('AI failure'));

    const caption = await generateSocialCaption(
      'tiktok',
      'Quick Coding Tips',
      'Description...',
      'https://mysite.com/tips'
    );

    expect(caption).toContain('Quick Coding Tips');
    expect(caption).toContain('https://mysite.com/tips');
  });
});
