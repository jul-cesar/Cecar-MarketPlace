import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { createRouteHandler, UTApi } from 'uploadthing/server'
import { uploadRouter } from './uploadthing.js'

const app = new Hono()
const utapi = new UTApi()
const uploadthingHandlers = createRouteHandler({
  router: uploadRouter,
})

app.use('*', logger())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.all('/api/uploadthing', (c) => {
  console.log('[media-service] uploadthing request', {
    actionType: c.req.query('actionType'),
    slug: c.req.query('slug'),
  })

  return uploadthingHandlers(c.req.raw)
})

app.post('/api/uploadthing/delete', async (c) => {
  const body = await c.req.json()
  const { keys } = body as { keys: string[] }

  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    return c.json({ error: 'keys array required' }, 400)
  }

  console.log('[media-service] delete request', { keys })

  const result = await utapi.deleteFiles(keys)

  console.log('[media-service] delete completed', {
    keys,
    success: result.success,
  })

  return c.json(result)
})

serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`[media-service] listening on http://localhost:${info.port}`)
  console.log('[media-service] upload endpoint: /api/uploadthing')
  console.log('[media-service] uploadthing token loaded:', Boolean(process.env.UPLOADTHING_TOKEN))
})
