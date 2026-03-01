import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { settings } from '../db/schema';

const SENSITIVE_KEYS = new Set(['glean_api_token']);

export function createSettingsRoutes() {
  const app = new Hono();

  app.get('/:key', async (c) => {
    const key = c.req.param('key');
    if (SENSITIVE_KEYS.has(key)) return c.json({ error: 'Forbidden' }, 403);
    const rows = await db.select().from(settings).where(eq(settings.key, key));
    if (rows.length === 0) return c.json({ value: null });
    return c.json({ value: rows[0].value });
  });

  app.put('/:key', async (c) => {
    const key = c.req.param('key');
    if (SENSITIVE_KEYS.has(key)) return c.json({ error: 'Forbidden' }, 403);
    const body = await c.req.json<{ value: string }>();
    if (typeof body.value !== 'string') return c.json({ error: 'value is required' }, 400);
    await db.insert(settings).values({ key, value: body.value }).onConflictDoUpdate({
      target: settings.key,
      set: { value: body.value },
    });
    return c.json({ key, value: body.value });
  });

  return app;
}
