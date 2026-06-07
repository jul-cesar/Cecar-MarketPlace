import { and, desc, eq, lt } from 'drizzle-orm'
import { db } from '../db/index.js'
import { conversation, conversationReadState, message } from '../db/schema.js'
import { httpError } from '../http/problem.js'
import { getConversationForUser } from './conversation.service.js'

export async function listMessages(
  conversationId: string,
  userId: string,
  options: { limit: number; before?: Date },
) {
  await getConversationForUser(conversationId, userId)

  const rows = await db
    .select()
    .from(message)
    .where(
      options.before
        ? and(
            eq(message.conversationId, conversationId),
            lt(message.createdAt, options.before),
          )
        : eq(message.conversationId, conversationId),
    )
    .orderBy(desc(message.createdAt))
    .limit(options.limit)

  return rows.reverse()
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
) {
  const current = await getConversationForUser(conversationId, senderId)

  if (current.status !== 'ACTIVE') {
    httpError({
      type: 'conversation-unavailable',
      title: 'Conversation unavailable',
      status: 409,
      detail: 'Only active conversations can receive messages',
    })
  }

  if (body.length > 2_000) {
    httpError({
      type: 'validation-error',
      title: 'Validation failed',
      status: 400,
      detail: 'body must be at most 2000 characters',
    })
  }

  const now = new Date()
  const created = (
    await db
      .insert(message)
      .values({
        conversationId,
        senderId,
        body,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
  )[0]

  if (!created) {
    httpError({
      type: 'message-create-failed',
      title: 'Message create failed',
      status: 500,
      detail: 'Could not create message',
    })
  }

  await db
    .update(conversation)
    .set({
      lastMessageId: created.id,
      lastMessageAt: created.createdAt,
      updatedAt: created.createdAt,
    })
    .where(eq(conversation.id, conversationId))

  await markConversationRead(conversationId, senderId, created.id)

  return created
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
  lastReadMessageId?: string,
) {
  await getConversationForUser(conversationId, userId)

  const now = new Date()
  const messageId = lastReadMessageId ?? (await getLatestMessageId(conversationId))

  await db
    .insert(conversationReadState)
    .values({
      conversationId,
      userId,
      lastReadMessageId: messageId,
      lastReadAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [conversationReadState.conversationId, conversationReadState.userId],
      set: {
        lastReadMessageId: messageId,
        lastReadAt: now,
        updatedAt: now,
      },
    })

  return { conversationId, userId, lastReadMessageId: messageId, lastReadAt: now }
}

async function getLatestMessageId(conversationId: string) {
  const latest = (
    await db
      .select({ id: message.id })
      .from(message)
      .where(eq(message.conversationId, conversationId))
      .orderBy(desc(message.createdAt))
      .limit(1)
  )[0]

  return latest?.id
}
