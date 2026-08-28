import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../logger';
import { env } from '../../env';
import { getSettings } from '../../storage';

export const GEMINI_MODELS = {
  FLASH: 'gemini-2.0-flash',
  PRO: 'gemini-1.5-pro',
};

export async function getActiveGeminiApiKey(): Promise<string> {
  try {
    const storedKey = await getSettings<string>('GEMINI_API_KEY');
    if (storedKey && storedKey.trim()) {
      return storedKey.trim();
    }
  } catch {
    // Fallback if storage fails
  }
  return process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
}

export async function callGeminiProvider(
  prompt: string,
  modelName: string = GEMINI_MODELS.FLASH
): Promise<string> {
  const apiKey = await getActiveGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment.');
  }
  const client = new GoogleGenerativeAI(apiKey);
  logger.debug(`Calling Gemini model: ${modelName}`, 'GEMINI');
  const model = client.getGenerativeModel({ model: modelName });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return result.response.text();
}
