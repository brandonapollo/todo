const API_BASE = '/api/settings';

export async function getSetting(key: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/${key}`);
  if (!res.ok) throw new Error('Failed to fetch setting');
  const data = await res.json() as { value: string | null };
  return data.value;
}

export async function putSetting(key: string, value: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error('Failed to save setting');
}
