import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../logger';
import { env } from '../../env';
import { getSettings } from '../../storage';

export const GEMINI_MODELS = {
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-3.1-pro-preview',
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
  try {
    const model = client.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return result.response.text();
  } catch (error: unknown) {
    const errStr = String(error);
    if (modelName === GEMINI_MODELS.FLASH && (errStr.includes('404') || errStr.includes('not found') || errStr.includes('no longer available'))) {
      logger.warn(`Gemini model ${modelName} returned error, retrying with ${GEMINI_MODELS.PRO}...`, 'GEMINI');
      const fallbackModel = client.getGenerativeModel({ model: GEMINI_MODELS.PRO });
      const fallbackResult = await fallbackModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      return fallbackResult.response.text();
    }
    throw error;
  }
}
