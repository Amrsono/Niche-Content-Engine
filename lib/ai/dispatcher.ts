import { logger } from '../logger';
import { env } from '../env';
import { stringifyError, delay } from './utils';
import { callGroqProvider, GROQ_MODELS, type GroqChatParams } from './providers/groq';
import { callGeminiProvider, GEMINI_MODELS } from './providers/gemini';
import { callOpenAIProvider, OPENAI_MODELS } from './providers/openai';
import type OpenAI from 'openai';

// Global Provider Cooldowns
export const providerCooldowns: Record<string, number> = {
  groq: 0,
  gemini: 0,
  openai: 0,
};

export const COOLDOWN_DURATION = 60000; // 60 seconds

export function resetProviderCooldowns(): void {
  providerCooldowns.groq = 0;
  providerCooldowns.gemini = 0;
  providerCooldowns.openai = 0;
}

export function isProviderCoolingDown(provider: 'groq' | 'gemini' | 'openai'): boolean {
  return Date.now() < (providerCooldowns[provider] || 0);
}

export function setProviderCooldown(provider: 'groq' | 'gemini' | 'openai', durationMs: number = COOLDOWN_DURATION): void {
  providerCooldowns[provider] = Date.now() + durationMs;
}

/**
 * Universal Multi-Provider AI Fallback Dispatcher
 * Priority: Groq -> Gemini -> OpenAI
 */
export async function callAIWithFallback(
  options: GroqChatParams
): Promise<{ text: string }> {
  // 1. Model selection: Fast model for simple tasks
  const isSimpleTask = (options.messages || []).some((m: { content?: unknown }) => {
    const c = typeof m.content === 'string' ? m.content.toLowerCase() : '';
    return c.includes('hashtag') || c.includes('meta description');
  });

  if (isSimpleTask && options.model === GROQ_MODELS.DISCOVERY) {
    options.model = GROQ_MODELS.FAST;
    logger.debug(`Using FAST_MODEL (${GROQ_MODELS.FAST}) for simple task`, 'AI');
  }

  const MAX_TRIES = 2;
  let attempt = 0;

  while (attempt < MAX_TRIES) {
    try {
      // 1. Try Groq (Primary)
      if (Date.now() > providerCooldowns.groq && (env.GROQ_API_KEY || process.env.GROQ_API_KEY)) {
        const response = await callGroqProvider(options);
        const text = response.choices[0]?.message?.content || '';
        return { text };
      } else {
        logger.warn('Groq unavailable or cooling down. Falling back to Gemini...', 'AI');
        throw { status: 429 };
      }
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      if (err.status === 429) {
        setProviderCooldown('groq');
        attempt++;
        if (attempt < MAX_TRIES) {
          const waitTime = 15000 * attempt;
          logger.warn(`Groq rate limited. Retrying in ${waitTime / 1000}s (Attempt ${attempt}/${MAX_TRIES})`, 'AI');
          await delay(waitTime);
          continue;
        }

        // 2. Try Gemini (Secondary)
        if (Date.now() > providerCooldowns.gemini && (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY)) {
          try {
            logger.info('Calling secondary fallback provider: Gemini...', 'AI');
            const prompt = (options.messages || [])
              .map((m: { role?: string; content?: unknown }) => `${m.role || 'user'}: ${String(m.content || '')}`)
              .join('\n');
            const text = await callGeminiProvider(prompt, GEMINI_MODELS.FLASH);
            return { text };
          } catch (gemError: unknown) {
            logger.error('Gemini fallback failed', 'AI', gemError);
            setProviderCooldown('gemini');

            // 3. Try OpenAI (Tertiary)
            if (Date.now() > providerCooldowns.openai && (env.OPENAI_API_KEY || process.env.OPENAI_API_KEY)) {
              logger.warn('Calling tertiary fallback provider: OpenAI...', 'AI');
              await delay(2000);
              try {
                const oaOptions: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
                  messages: options.messages as OpenAI.Chat.ChatCompletionMessageParam[],
                  model: OPENAI_MODELS.MINI,
                };
                const oaRes = await callOpenAIProvider(oaOptions);
                const text = oaRes.choices[0]?.message?.content || '';
                return { text };
              } catch (oaError: unknown) {
                setProviderCooldown('openai');
                logger.error('OpenAI fallback failed', 'AI', oaError);
                throw new Error(`CRITICAL: All AI providers exhausted. Latest error: ${stringifyError(oaError)}`);
              }
            }
          }
        }
      }
      throw new Error(`AI execution failed: ${stringifyError(e)}`);
    }
  }

  throw new Error('AI call failed to return a valid response after all retries and fallbacks.');
}
