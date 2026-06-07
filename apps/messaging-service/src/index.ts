import 'dotenv/config'
import { getRequestListener } from '@hono/node-server'
import { createServer } from 'node:http'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { HttpError, problem } from './http/problem.js'
import { conversationRoutes } from './routes/conversation.routes.js'
import { setupSocketServer } from './socket/index.js'

const app = new Hono()

app.use('*', logger())

if (process.env.ENABLE_SERVICE_CORS !== 'false') {
  app.use(
    '*',
    cors({
      origin: [
        process.env.FRONTEND_URL ?? 'http://localhost:5173',
        'http://localhost:5173',
      ],
      credentials: true,
    }),
  )
}

app.get('/', (c) => {
  return c.text('Messaging service')
})

app.get('/health', (c) => {
  return c.json({ status: 'UP', service: 'messaging-service' })
})

app.route('/conversations', conversationRoutes)

app.notFound((c) =>
  problem(c, {
    type: 'not-found',
    title: 'Not found',
    status: 404,
    detail: 'Route not found',
  }),
)

app.onError((err, c) => {
  if (err instanceof HttpError) {
    return problem(c, err.problem)
  }

  console.error('[messaging-service] unhandled error', err)

  return problem(c, {
    type: 'internal-server-error',
    title: 'Internal server error',
    status: 500,
    detail: 'Unexpected messaging service error',
  })
})

const port = Number(process.env.PORT ?? 3002)

const honoListener = getRequestListener(app.fetch)
const server = createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    const body = JSON.stringify({ status: 'UP', service: 'messaging-service' })

    response.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    })
    response.end(body)
    return
  }

  honoListener(request, response)
})

setupSocketServer(server)

server.listen(port, () => {
  console.log(`[messaging-service] listening on http://localhost:${port}`)
})
