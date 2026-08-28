import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireServerAdmin } from '@/lib/adminGuard.server';
import { getSettings } from '@/lib/storage';
import { env } from '@/lib/env';
import { stringifyError } from '@/lib/ai/utils';

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent("Hello, verify API connection.");
    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Gemini 2.0 Flash!',
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
