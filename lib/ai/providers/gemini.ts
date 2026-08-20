import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../logger';
import { env } from '../../env';

export const GEMINI_MODELS = {
  FLASH: 'gemini-2.0-flash',
  PRO: 'gemini-1.5-pro',
};

let genAIClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '');
  }
  return genAIClient;
}

export async function callGeminiProvider(
  prompt: string,
  modelName: string = GEMINI_MODELS.FLASH
): Promise<string> {
  const client = getGeminiClient();
  logger.debug(`Calling Gemini model: ${modelName}`, 'GEMINI');
  const model = client.getGenerativeModel({ model: modelName });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return result.response.text();
}
