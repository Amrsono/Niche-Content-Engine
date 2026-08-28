import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/adminGuard.server';
import { saveSettings, getSettings } from '@/lib/storage';
import { env } from '@/lib/env';

function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export async function GET() {
  const authRes = await requireServerAdmin();
  if (!authRes.authorized) {
    return authRes.errorResponse!;
  }

  const storedKey = await getSettings<string>('GEMINI_API_KEY');
  const activeKey = (storedKey && storedKey.trim()) || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';

  return NextResponse.json({
    success: true,
    configured: Boolean(activeKey),
    maskedKey: maskKey(activeKey),
  });
}

export async function POST(req: Request) {
  const authRes = await requireServerAdmin();
  if (!authRes.authorized) {
    return authRes.errorResponse!;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey } = body;

    if (typeof apiKey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: apiKey must be a string' },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();
    await saveSettings('GEMINI_API_KEY', trimmedKey);
    process.env.GEMINI_API_KEY = trimmedKey;

    return NextResponse.json({
      success: true,
      message: 'Gemini API key saved successfully',
      configured: Boolean(trimmedKey),
      maskedKey: maskKey(trimmedKey),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
