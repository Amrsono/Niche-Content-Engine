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
  const response = await client.chat.completions.create(params);
  return response as GroqChatCompletion;
}
