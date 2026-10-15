import { logger } from '../../logger';

export const OLLAMA_MODELS = {
  DISCOVERY: 'llama3.2',
  REASONING: 'llama3.2',
  FAST: 'llama3.2',
};

export interface OllamaChatParams {
  model?: string;
  messages: { role: string; content: string }[];
  max_tokens?: number;
  format?: 'json';
}

export async function callOllamaProvider(options: OllamaChatParams): Promise<{ text: string }> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = options.model || OLLAMA_MODELS.REASONING;

  const payload: Record<string, unknown> = {
    model,
    messages: options.messages,
    stream: false,
    options: {
      num_predict: options.max_tokens || 2000,
    },
  };

  if (options.format) {
    payload.format = options.format;
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120000), // 2 min timeout for local models
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.message?.content || '';

  if (!text) throw new Error('Ollama returned empty response');

  logger.debug(`Ollama (${model}) responded successfully`, 'OLLAMA');
  return { text };
}

export async function isOllamaAvailable(): Promise<boolean> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
