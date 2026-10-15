import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/adminGuard.server';
import { saveSettings, getSettings } from '@/lib/storage';

export async function GET() {
  const authRes = await requireServerAdmin();
  if (!authRes.authorized) {
    return authRes.errorResponse!;
  }

  const storedBaseUrl = await getSettings<string>('OLLAMA_BASE_URL');
  const baseUrl = storedBaseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  const storedModel = await getSettings<string>('OLLAMA_MODEL');
  const activeModel = storedModel || process.env.OLLAMA_MODEL || 'llama3.2:latest';

  const storedEnabled = await getSettings<boolean>('OLLAMA_ENABLED');
  const enabled = storedEnabled !== null ? storedEnabled : true; // Default to true if Ollama is running

  let isAvailable = false;
  let models: string[] = [];

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      isAvailable = true;
      const data = await res.json();
      models = (data.models || []).map((m: { name?: string }) => m.name || '');
    }
  } catch {
    isAvailable = false;
  }

  return NextResponse.json({
    success: true,
    isAvailable,
    baseUrl,
    models,
    activeModel,
    enabled,
  });
}

export async function POST(req: Request) {
  const authRes = await requireServerAdmin();
  if (!authRes.authorized) {
    return authRes.errorResponse!;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { enabled, model, baseUrl } = body;

    if (typeof enabled === 'boolean') {
      await saveSettings('OLLAMA_ENABLED', enabled);
    }

    if (typeof model === 'string' && model.trim()) {
      await saveSettings('OLLAMA_MODEL', model.trim());
      process.env.OLLAMA_MODEL = model.trim();
    }

    if (typeof baseUrl === 'string' && baseUrl.trim()) {
      await saveSettings('OLLAMA_BASE_URL', baseUrl.trim());
      process.env.OLLAMA_BASE_URL = baseUrl.trim();
    }

    return NextResponse.json({
      success: true,
      message: 'Ollama configuration saved successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save Ollama settings' },
      { status: 500 }
    );
  }
}
