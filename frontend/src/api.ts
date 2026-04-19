import type { PipelineResult } from './types';

const BASE = '/api';

export async function runPipeline(csvFile: File | null, backend: string): Promise<PipelineResult> {
  const form = new FormData();
  if (csvFile) form.append('csv_file', csvFile);
  form.append('backend', backend);
  const res = await fetch(`${BASE}/run`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((err as { error: string }).error || 'Pipeline failed');
  }
  return res.json() as Promise<PipelineResult>;
}

export async function sendChat(question: string): Promise<string> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error('Chat request failed');
  const data = await res.json() as { answer: string };
  return data.answer;
}
