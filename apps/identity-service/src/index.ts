import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { inArray } from 'drizzle-orm'
import { auth } from './lib/auth.js';
import { db } from './db/index.js';
import { user } from './db/schema.js';
import { isInstitutionalEmail } from './lib/email-policy.js';

console.log('[identity-service] BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL);
console.log('[identity-service] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
console.log('[identity-service] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING');
console.log('[identity-service] FRONTEND_URL:', process.env.FRONTEND_URL);

const app = new Hono()

app.use("*", logger());

app.use("/auth/*", async (c, next) => {
  const path = c.req.path;
  if (path === '/auth/sign-up/email' || path === '/auth/sign-in/email') {
    try {
      const cloned = c.req.raw.clone();
      const body = await cloned.json();
      const email: string | undefined = body?.email;
      if (!isInstitutionalEmail(email)) {
        return c.json(
          { error: 'forbidden', message: 'Solo se permiten correos institucionales (@cecar.edu.co)' },
          403
        );
      }
    } catch {
      // body not parseable — let Better Auth handle it
    }
  }
  return next();
});

app.all("/auth/*", async (c) => auth.handler(c.req.raw));

app.get("/internal/v1/validate-session", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers
  });
  
  if (!session) {
    return c.json({ error: "invalid_session" }, 401);
  }
  
  return c.json({
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role ?? "USER" 
  });
});

app.post("/internal/v1/users/basic", async (c) => {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }

  const userIds =
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    Array.isArray((body as { userIds?: unknown }).userIds)
      ? (body as { userIds: unknown[] }).userIds
      : null;

  if (!userIds) {
    return c.json({ error: "userIds array required" }, 400);
  }

  const ids = [...new Set(userIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0))].slice(0, 100);

  if (ids.length === 0) {
    return c.json({ data: [] });
  }

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
    })
    .from(user)
    .where(inArray(user.id, ids));

  return c.json({ data: users });
});

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
