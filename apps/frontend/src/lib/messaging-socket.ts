import { io, type Socket } from 'socket.io-client'
import { apiRoutes } from '@/lib/api'
import type { Conversation, Message } from '@/lib/messaging'

type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error?: { detail?: string; title?: string } }

type ServerToClientEvents = {
  'message:new': (message: Message) => void
  'conversation:updated': (conversation: Conversation) => void
  'messages:read': (payload: ReadReceipt) => void
  'typing:start': (payload: TypingPayload) => void
  'typing:stop': (payload: TypingPayload) => void
}

type ClientToServerEvents = {
  'conversation:join': (
    payload: { conversationId: string },
    ack?: (response: Ack<{ conversationId: string; joined: boolean }>) => void,
  ) => void
  'message:send': (
    payload: { conversationId: string; body: string },
    ack?: (response: Ack<Message>) => void,
  ) => void
  'messages:read': (
    payload: { conversationId: string; lastReadMessageId?: string },
    ack?: (response: Ack<unknown>) => void,
  ) => void
  'typing:start': (
    payload: { conversationId: string },
    ack?: (response: Ack<{ conversationId: string }>) => void,
  ) => void
  'typing:stop': (
    payload: { conversationId: string },
    ack?: (response: Ack<{ conversationId: string }>) => void,
  ) => void
}

export type ReadReceipt = {
  conversationId: string
  userId: string
  lastReadMessageId?: string
  lastReadAt: string
}

export type TypingPayload = {
  conversationId: string
  userId: string
}

export type MessagingSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export function createMessagingSocket() {
  const socketUrl =
    import.meta.env.VITE_MESSAGING_SOCKET_URL?.replace(/\/$/, '') ??
    apiRoutes.messaging.baseUrl

  return io(socketUrl, {
    path: import.meta.env.VITE_MESSAGING_SOCKET_PATH ?? apiRoutes.messaging.socketPath,
    withCredentials: true,
    transports: ['websocket', 'polling'],
  }) as MessagingSocket
}

export function ackToPromise<T>(emit: (ack: (response: Ack<T>) => void) => void) {
  return new Promise<T>((resolve, reject) => {
    emit((response) => {
      if (response.ok) {
        resolve(response.data)
        return
      }

      reject(new Error(response.error?.detail ?? response.error?.title ?? 'Socket error'))
    })
  })
}
