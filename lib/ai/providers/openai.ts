import OpenAI from 'openai';
import { logger } from '../../logger';
import { env } from '../../env';

export const OPENAI_MODELS = {
  MINI: 'gpt-4o-mini',
  STANDARD: 'gpt-4o',
};

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '' });
  }
  return openaiClient;
}

export async function callOpenAIProvider(
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming
): Promise<OpenAI.Chat.ChatCompletion> {
  const client = getOpenAIClient();
  logger.debug(`Calling OpenAI model: ${params.model}`, 'OPENAI');
  return client.chat.completions.create(params);
}
