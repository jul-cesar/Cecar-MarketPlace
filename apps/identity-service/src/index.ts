import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { auth } from './lib/auth.js';

console.log('[identity-service] BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL);
console.log('[identity-service] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
console.log('[identity-service] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING');
console.log('[identity-service] FRONTEND_URL:', process.env.FRONTEND_URL);

const app = new Hono()

app.use("*", logger());

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

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
