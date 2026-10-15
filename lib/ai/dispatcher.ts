import { logger } from '../logger';
import { env } from '../env';
import { stringifyError, delay } from './utils';
import { callGroqProvider, GROQ_MODELS, type GroqChatParams } from './providers/groq';
import { callGeminiProvider, GEMINI_MODELS, getActiveGeminiApiKey } from './providers/gemini';
import { callOpenAIProvider, OPENAI_MODELS } from './providers/openai';
import { callOllamaProvider, isOllamaAvailable } from './providers/ollama';
import { getSettings } from '../storage';
import type OpenAI from 'openai';

// Global Provider Cooldowns
export const providerCooldowns: Record<string, number> = {
  ollama: 0,
  groq: 0,
  gemini: 0,
  openai: 0,
};

export const COOLDOWN_DURATION = 60000; // 60 seconds

export function resetProviderCooldowns(): void {
  providerCooldowns.ollama = 0;
  providerCooldowns.groq = 0;
  providerCooldowns.gemini = 0;
  providerCooldowns.openai = 0;
}

export function isProviderCoolingDown(provider: 'ollama' | 'groq' | 'gemini' | 'openai'): boolean {
  return Date.now() < (providerCooldowns[provider] || 0);
}

export function setProviderCooldown(provider: 'ollama' | 'groq' | 'gemini' | 'openai', durationMs: number = COOLDOWN_DURATION): void {
  providerCooldowns[provider] = Date.now() + durationMs;
}

/**
 * Universal Multi-Provider AI Fallback Dispatcher
 * Priority: Local Ollama (if available) -> Groq -> Gemini -> OpenAI
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

  // 0. Try Local Ollama (First priority for zero-cost, private offline inference)
  const ollamaSetting = await getSettings<boolean>('OLLAMA_ENABLED');
  const isOllamaUserEnabled = ollamaSetting !== false;

  if (isOllamaUserEnabled && Date.now() > providerCooldowns.ollama) {
    const isAvail = await isOllamaAvailable();
    if (isAvail) {
      try {
        const storedModel = await getSettings<string>('OLLAMA_MODEL');
        const activeModel = storedModel || process.env.OLLAMA_MODEL || 'llama3.2:latest';
        const isJson = options.response_format?.type === 'json_object' ||
          (options.messages || []).some(m => typeof m.content === 'string' && (m.content.toLowerCase().includes('return json') || m.content.toLowerCase().includes('as json') || m.content.toLowerCase().includes('in json')));
        logger.info(`Calling local Ollama (${activeModel})${isJson ? ' [JSON mode]' : ''}...`, 'AI');
        const res = await callOllamaProvider({
          model: activeModel,
          messages: options.messages as { role: string; content: string }[],
          max_tokens: options.max_tokens || undefined,
          format: isJson ? 'json' : undefined,
        });
        if (res.text) return { text: res.text };
      } catch (ollamaErr: unknown) {
        setProviderCooldown('ollama', 15000);
        logger.warn(`Local Ollama failed (${stringifyError(ollamaErr)}). Falling back to cloud...`, 'AI');
      }
    }
  }

  // 1. Try Groq (Primary Cloud)
  const hasGroqKey = Boolean(env.GROQ_API_KEY || process.env.GROQ_API_KEY);
  if (Date.now() > providerCooldowns.groq && hasGroqKey) {
    try {
      const response = await callGroqProvider(options);
      const text = response.choices[0]?.message?.content || '';
      if (text) return { text };
    } catch (e: unknown) {
      setProviderCooldown('groq', 15000);
      logger.warn(`Groq provider failed (${stringifyError(e)}). Cooled down Groq and attempting fallback...`, 'AI');
    }
  }

  // 2. Try Gemini (Secondary Fallback with auto-retry for transient errors/rate limits)
  const activeGeminiKey = await getActiveGeminiApiKey();
  if (Date.now() > providerCooldowns.gemini && activeGeminiKey) {
    let geminiAttempts = 0;
    const MAX_GEMINI_ATTEMPTS = 3;

    while (geminiAttempts < MAX_GEMINI_ATTEMPTS) {
      try {
        logger.info('Calling secondary fallback provider: Gemini...', 'AI');
        const prompt = (options.messages || [])
          .map((m: { role?: string; content?: unknown }) => `${m.role || 'user'}: ${String(m.content || '')}`)
          .join('\n');
        const text = await callGeminiProvider(prompt, GEMINI_MODELS.FLASH);
        if (text) return { text };
      } catch (gemError: unknown) {
        geminiAttempts++;
        const errStr = stringifyError(gemError);

        if (geminiAttempts < MAX_GEMINI_ATTEMPTS) {
          logger.warn(`Gemini attempt ${geminiAttempts} failed (${errStr.slice(0, 120)}). Pausing 8s before retry...`, 'AI');
          await delay(8000);
          continue;
        }

        setProviderCooldown('gemini', 15000);
        logger.error('Gemini fallback failed after all retries', 'AI', gemError);
        break;
      }
    }
  }

  // 3. Try OpenAI (Tertiary Fallback)
  const hasOpenAIKey = Boolean(env.OPENAI_API_KEY || process.env.OPENAI_API_KEY);
  if (Date.now() > providerCooldowns.openai && hasOpenAIKey) {
    logger.warn('Calling tertiary fallback provider: OpenAI...', 'AI');
    try {
      const oaOptions: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
        messages: options.messages as OpenAI.Chat.ChatCompletionMessageParam[],
        model: OPENAI_MODELS.MINI,
      };
      const oaRes = await callOpenAIProvider(oaOptions);
      const text = oaRes.choices[0]?.message?.content || '';
      if (text) return { text };
    } catch (oaError: unknown) {
      setProviderCooldown('openai', 30000);
      logger.error('OpenAI fallback failed', 'AI', oaError);
      throw new Error(`CRITICAL: All AI providers exhausted. Latest error: ${stringifyError(oaError)}`);
    }
  }

  throw new Error('All configured AI providers (Groq, Gemini, OpenAI) failed or are unavailable.');
}
