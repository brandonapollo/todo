const API_BASE = '/api/glean';

export type GleanResult = {
  id: string;
  title: string;
  snippet: string;
  url?: string;
  author?: string;
};

export type GleanConfig = {
  instance: string | null;
  userName: string | null;
  maskedToken: string | null;
};

export async function getGleanConfig(): Promise<GleanConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error('Failed to load Glean config');
  return res.json() as Promise<GleanConfig>;
}

export async function saveGleanConfig(instance: string, token?: string, userName?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instance, token, userName }),
  });
  if (!res.ok) throw new Error('Failed to save Glean config');
}

export async function searchGlean(): Promise<GleanResult[]> {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? 'Failed to search Glean');
  }
  return res.json() as Promise<GleanResult[]>;
}
