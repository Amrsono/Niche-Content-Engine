import { NextResponse } from 'next/server';
import { getAvailableAIProviders } from '@/lib/env';
import { errorTracker } from '@/lib/errorTracking';

export async function GET() {
  const aiProviders = getAvailableAIProviders();
  const uptime = process.uptime();

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(uptime),
    hasHealthEndpoint: true,
    features: {
      ai: {
        groqConfigured: aiProviders.groq,
        geminiConfigured: aiProviders.gemini,
        openaiConfigured: aiProviders.openai,
      },
      storage: {
        redisConfigured: Boolean(process.env.REDIS_URL || process.env.KV_URL),
      },
      indexing: {
        googleServiceAccount: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      },
      errorTracking: {
        sentryConfigured: errorTracker.isConfigured,
      },
    },
  });
}
