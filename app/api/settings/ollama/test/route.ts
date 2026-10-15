import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/adminGuard.server';
import { callOllamaProvider } from '@/lib/ai/providers/ollama';

export async function POST(req: Request) {
  const authRes = await requireServerAdmin();
  if (!authRes.authorized) {
    return authRes.errorResponse!;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const model = body.model || 'llama3.2:latest';

    const startTime = Date.now();
    const result = await callOllamaProvider({
      model,
      messages: [{ role: 'user', content: 'Reply with: "Ollama connection verified!"' }],
      max_tokens: 30,
    });
    const elapsedMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Ollama test passed in ${elapsedMs}ms: "${result.text.trim()}"`,
      model,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ollama test failed. Make sure Ollama is running.' 
      },
      { status: 500 }
    );
  }
}
