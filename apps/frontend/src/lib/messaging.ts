import { apiRoutes } from '@/lib/api'

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED'
export type MessageStatus = 'SENT' | 'DELETED'

export type BasicUser = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string | null
}

export type BasicListing = {
  id: string
  title: string
  coverImageUrl: string | null
  status?: string | null
}

export type Conversation = {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  status: ConversationStatus
  lastMessageId: string | null
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
  lastMessage?: Message | null
  unreadCount?: number
  buyer?: BasicUser | null
  seller?: BasicUser | null
  peer?: BasicUser | null
  listing?: BasicListing | null
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  body: string
  status: MessageStatus
  createdAt: string
  updatedAt: string
}

type CollectionResponse<T> = {
  data: T[]
}

export async function createConversation(listingId: string) {
  const response = await fetch(apiRoutes.messaging.conversations, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ listingId }),
  })

  return parseResponse<Conversation>(response)
}

export async function listConversations() {
  const response = await fetch(apiRoutes.messaging.conversations, {
    credentials: 'include',
  })
  const payload = await parseResponse<CollectionResponse<Conversation>>(response)

  return payload.data
}

export async function listMessages(conversationId: string) {
  const response = await fetch(apiRoutes.messaging.conversationMessages(conversationId), {
    credentials: 'include',
  })
  const payload = await parseResponse<CollectionResponse<Message>>(response)

  return payload.data
}

export async function sendMessageHttp(conversationId: string, body: string) {
  const response = await fetch(apiRoutes.messaging.conversationMessages(conversationId), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  })

  return parseResponse<Message>(response)
}

export async function markConversationRead(conversationId: string, lastReadMessageId?: string) {
  const response = await fetch(apiRoutes.messaging.conversationRead(conversationId), {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lastReadMessageId }),
  })

  return parseResponse(response)
}

async function parseResponse<T>(response: Response) {
  if (response.ok) {
    return (await response.json()) as T
  }

  let detail = 'No pudimos completar la accion.'

  try {
    const payload = (await response.json()) as { detail?: string; title?: string }
    detail = payload.detail ?? payload.title ?? detail
  } catch {
    detail = response.statusText || detail
  }

  throw new Error(detail)
}
