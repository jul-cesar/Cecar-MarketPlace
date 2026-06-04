import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { auth } from './lib/auth.js';

const app = new Hono()


app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

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
