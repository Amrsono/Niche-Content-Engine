import Groq from 'groq-sdk';
import { logger } from '../../logger';
import { env } from '../../env';

export const GROQ_MODELS = {
  DISCOVERY: 'llama-3.3-70b-versatile',
  REASONING: 'llama-3.3-70b-versatile',
  FAST: 'llama-3.1-8b-instant',
};

export type GroqChatParams = Parameters<Groq['chat']['completions']['create']>[0];
export type GroqChatCompletion = Groq.Chat.Completions.ChatCompletion;
export type GroqChatResponse = GroqChatCompletion;

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY || process.env.GROQ_API_KEY || '' });
  }
  return groqClient;
}

export async function callGroqProvider(params: GroqChatParams): Promise<GroqChatCompletion> {
  const client = getGroqClient();
  logger.debug(`Calling Groq model: ${params.model}`, 'GROQ');
  try {
    const response = await client.chat.completions.create(params);
    return response as GroqChatCompletion;
  } catch (error: unknown) {
    const errString = String(error);
    if (
      params.model !== GROQ_MODELS.FAST &&
      (errString.includes('404') || errString.includes('model_not_found') || errString.includes('does not exist'))
    ) {
      logger.warn(`Model ${params.model} unavailable on Groq, retrying with ${GROQ_MODELS.FAST}...`, 'GROQ');
      const fallbackParams = { ...params, model: GROQ_MODELS.FAST };
      const response = await client.chat.completions.create(fallbackParams);
      return response as GroqChatCompletion;
    }
    throw error;
  }
}
