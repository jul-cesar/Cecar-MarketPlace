import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import type { ZodError, ZodType } from 'zod'
import type { AuthUser } from '../http/auth.js'
import {
  joinConversationEventSchema,
  markReadEventSchema,
  sendMessageEventSchema,
  typingEventSchema,
} from '../schemas/messaging.schemas.js'
import { getConversationForUser } from '../services/conversation.service.js'
import {
  markConversationRead,
  sendMessage,
} from '../services/message.service.js'
import { validateSocketSession } from './auth.js'

type Ack = (response: unknown) => void

type ClientToServerEvents = {
  'conversation:join': (payload: unknown, ack?: Ack) => void
  'message:send': (payload: unknown, ack?: Ack) => void
  'messages:read': (payload: unknown, ack?: Ack) => void
  'typing:start': (payload: unknown, ack?: Ack) => void
  'typing:stop': (payload: unknown, ack?: Ack) => void
}

type ServerToClientEvents = {
  'message:new': (payload: unknown) => void
  'conversation:updated': (payload: unknown) => void
  'messages:read': (payload: unknown) => void
  'typing:start': (payload: unknown) => void
  'typing:stop': (payload: unknown) => void
}

type InterServerEvents = Record<string, never>

type SocketData = {
  user: AuthUser
}

const frontendOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost',
  'https://cecarhub.com',
  'https://www.cecarhub.com',
].filter(Boolean) as string[]

export function setupSocketServer(server: HttpServer) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, {
    cors: {
      origin: frontendOrigins,
      credentials: true,
    },
  })

  io.use(async (socket, next) => {
    try {
      const user = await validateSocketSession(socket.request.headers)

      if (!user) {
        next(new Error('Unauthorized'))
        return
      }

      socket.data.user = user
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user

    socket.join(userRoom(user.id))

    socket.on('conversation:join', async (payload, ack?: Ack) => {
      await handleSocketEvent(ack, async () => {
        const { conversationId } = parsePayload(
          joinConversationEventSchema,
          payload,
        )

        await getConversationForUser(conversationId, user.id)
        await socket.join(conversationRoom(conversationId))

        return { conversationId, joined: true }
      })
    })

    socket.on('message:send', async (payload, ack?: Ack) => {
      await handleSocketEvent(ack, async () => {
        const { conversationId, body } = parsePayload(
          sendMessageEventSchema,
          payload,
        )
        const created = await sendMessage(conversationId, user.id, body)
        const current = await getConversationForUser(conversationId, user.id)

        io.to(userRoom(current.buyerId))
          .to(userRoom(current.sellerId))
          .emit('message:new', created)
        io.to(userRoom(current.buyerId))
          .to(userRoom(current.sellerId))
          .emit('conversation:updated', current)

        return created
      })
    })

    socket.on('messages:read', async (payload, ack?: Ack) => {
      await handleSocketEvent(ack, async () => {
        const { conversationId, lastReadMessageId } = parsePayload(
          markReadEventSchema,
          payload,
        )
        const result = await markConversationRead(
          conversationId,
          user.id,
          lastReadMessageId,
        )
        const current = await getConversationForUser(conversationId, user.id)

        io.to(userRoom(current.buyerId))
          .to(userRoom(current.sellerId))
          .emit('messages:read', result)

        return result
      })
    })

    socket.on('typing:start', async (payload, ack?: Ack) => {
      await handleSocketEvent(ack, async () => {
        const { conversationId } = parsePayload(typingEventSchema, payload)
        const current = await getConversationForUser(conversationId, user.id)

        emitToPeer(io, current, user.id, 'typing:start', {
          conversationId,
          userId: user.id,
        })

        return { conversationId }
      })
    })

    socket.on('typing:stop', async (payload, ack?: Ack) => {
      await handleSocketEvent(ack, async () => {
        const { conversationId } = parsePayload(typingEventSchema, payload)
        const current = await getConversationForUser(conversationId, user.id)

        emitToPeer(io, current, user.id, 'typing:stop', {
          conversationId,
          userId: user.id,
        })

        return { conversationId }
      })
    })
  })

  return io
}

function emitToPeer(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  current: { buyerId: string; sellerId: string },
  senderId: string,
  event: 'typing:start' | 'typing:stop',
  payload: unknown,
) {
  const peerId = current.buyerId === senderId ? current.sellerId : current.buyerId

  io.to(userRoom(peerId)).emit(event, payload)
}

function userRoom(userId: string) {
  return `user:${userId}`
}

function conversationRoom(conversationId: string) {
  return `conversation:${conversationId}`
}

async function handleSocketEvent(ack: Ack | undefined, handler: () => Promise<unknown>) {
  try {
    const data = await handler()

    ack?.({ ok: true, data })
  } catch (error) {
    const payload = toSocketError(error)

    ack?.({ ok: false, error: payload })
  }
}

function parsePayload<TSchema extends ZodType>(schema: TSchema, payload: unknown) {
  return schema.parse(payload) as TSchema['_output']
}

function toSocketError(error: unknown) {
  if (isZodError(error)) {
    return {
      type: 'validation-error',
      title: 'Validation failed',
      detail: error.issues
        .map((issue) => `${issue.path.join('.') || 'payload'}: ${issue.message}`)
        .join('; '),
    }
  }

  if (error && typeof error === 'object' && 'problem' in error) {
    return (error as { problem: unknown }).problem
  }

  return {
    type: 'internal-server-error',
    title: 'Internal server error',
    detail: 'Unexpected socket error',
  }
}

function isZodError(error: unknown): error is ZodError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'issues' in error &&
      Array.isArray((error as { issues?: unknown }).issues),
  )
}
