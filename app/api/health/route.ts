import { NextResponse } from 'next/server';
import { getAvailableAIProviders } from '@/lib/env';

export async function GET() {
  const aiProviders = getAvailableAIProviders();
  const uptime = process.uptime();

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    uptimeSeconds: Math.floor(uptime),
    features: {
      ai: {
        groqConfigured: aiProviders.groq,
        geminiConfigured: aiProviders.gemini,
        openaiConfigured: aiProviders.openai,
      },
      indexing: {
        googleServiceAccount: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      },
    },
  });
}
