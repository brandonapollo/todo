import { Hono } from "hono";
import { eq, inArray } from "drizzle-orm";
import { db } from "../db/connection";
import { settings } from "../db/schema";

export type GleanResult = {
  id: string;
  title: string;
  snippet: string;
  url?: string;
  author?: string;
};

const FALLBACK_QUERY =
  "reply needed OR action required OR please respond OR waiting on you OR can you OR please review OR let me know OR lmk OR what do you think OR blocked OR following up OR any update OR thoughts OR feedback";

async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(settings).where(eq(settings.key, key));
  return rows.length > 0 ? rows[0].value : null;
}

async function upsertSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export function createGleanRoutes() {
  const app = new Hono();

  app.get("/config", async (c) => {
    const rows = await db
      .select()
      .from(settings)
      .where(
        inArray(settings.key, [
          "glean_instance",
          "glean_user_name",
          "glean_api_token",
        ]),
      );
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const raw = map.glean_api_token ?? null;
    const maskedToken = raw && raw.length > 8
      ? `${raw.slice(0, 4)}${'*'.repeat(raw.length - 8)}${raw.slice(-4)}`
      : raw ? '*'.repeat(raw.length) : null;
    return c.json({
      instance: map.glean_instance ?? null,
      userName: map.glean_user_name ?? null,
      maskedToken,
    });
  });

  app.post("/config", async (c) => {
    const body = await c.req.json<{
      instance: string;
      token?: string;
      userName?: string;
    }>();
    const { instance, token, userName } = body;
    if (!instance?.trim()) {
      return c.json({ error: "instance is required" }, 400);
    }
    await Promise.all([
      upsertSetting("glean_instance", instance.trim()),
      ...(token?.trim() ? [upsertSetting("glean_api_token", token.trim())] : []),
      ...(userName?.trim() ? [upsertSetting("glean_user_name", userName.trim())] : []),
    ]);
    return c.json({ ok: true });
  });

  app.post("/search", async (c) => {
    const body = await c.req.json<{ days?: number }>().catch(() => ({}));
    const days = (body as { days?: number }).days ?? 3;

    const [token, instance, userName] = await Promise.all([
      getSetting("glean_api_token"),
      getSetting("glean_instance"),
      getSetting("glean_user_name"),
    ]);

    if (!token || !instance) {
      return c.json({ error: "Glean is not configured" }, 400);
    }

    const query = userName
      ? `@${userName} OR ${userName} OR ${FALLBACK_QUERY}`
      : FALLBACK_QUERY;

    const gleanUrl = `https://${instance}-be.glean.com/rest/api/v1/search`;
    const requestBody = {
      query,
      pageSize: 50,
      requestOptions: {
        facetFilters: [
          {
            fieldName: "app",
            values: [{ value: "slack", relationType: "EQUALS" }],
          },
          {
            fieldName: "last_updated_at",
            values: [
              {
                relationType: "GT",
                value: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 10),
              },
            ],
          },
        ],
      },
    };
    console.log("Glean request:", JSON.stringify(requestBody, null, 2));

    let res: Response;
    try {
      res = await fetch(gleanUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
    } catch {
      return c.json({ error: "Failed to reach Glean API" }, 502);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return c.json(
        { error: `Glean API error: ${res.status}`, detail: text },
        502,
      );
    }

    const data = (await res.json()) as {
      results?: {
        title?: string;
        url?: string;
        fullTextList?: string[];
        relatedResults?: {
          results?: {
            snippets?: { text?: string }[];
          }[];
        }[];
        document?: {
          metadata?: {
            author?: { name?: string };
          };
        };
      }[];
    };

    const results: GleanResult[] = (data.results ?? [])
      .filter((r) => {
        const author = r.document?.metadata?.author?.name;
        if (userName && author === userName) return false;
        return true;
      })
      .map((r, i) => {
        const snippet =
          r.relatedResults?.[0]?.results?.[0]?.snippets?.[0]?.text ??
          r.fullTextList?.[0]?.slice(0, 200) ??
          "";
        return {
          id: `glean-${i}-${Date.now()}`,
          title: r.title ?? "",
          snippet,
          url: r.url,
          author: r.document?.metadata?.author?.name,
        };
      });

    return c.json(results);
  });

  return app;
}
