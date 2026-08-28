import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireServerAdmin } from '@/lib/adminGuard.server';
import { getSettings } from '@/lib/storage';
import { env } from '@/lib/env';
import { stringifyError } from '@/lib/ai/utils';
import { GEMINI_MODELS } from '@/lib/ai/providers/gemini';

export async function POST(req: Request) {
  const authRes = await requireServerAdmin();
  if (!authRes.authorized) {
    return authRes.errorResponse!;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey } = body;

    let targetKey = typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : '';

    if (!targetKey) {
      const storedKey = await getSettings<string>('GEMINI_API_KEY');
      targetKey = (storedKey && storedKey.trim()) || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    }

    if (!targetKey) {
      return NextResponse.json(
        { success: false, error: 'No Gemini API key provided or configured.' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(targetKey);
    let modelName = GEMINI_MODELS.FLASH;
    let result;

    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      result = await model.generateContent("Hello, verify API connection.");
    } catch (e: unknown) {
      const errStr = String(e);
      if (errStr.includes('404') || errStr.includes('not found') || errStr.includes('no longer available')) {
        modelName = GEMINI_MODELS.PRO;
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent("Hello, verify API connection.");
      } else {
        throw e;
      }
    }

    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      message: `Successfully connected to Gemini API (${modelName})!`,
      sampleResponse: responseText.slice(0, 100),
    });
  } catch (error) {
    const errorMessage = stringifyError(error);
    return NextResponse.json(
      { success: false, error: `Gemini API test failed: ${errorMessage}` },
      { status: 400 }
    );
  }
}
