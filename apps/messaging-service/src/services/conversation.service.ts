import { and, count, desc, eq, gt, ne, or } from 'drizzle-orm'
import { db } from '../db/index.js'
import { conversation, conversationReadState, message } from '../db/schema.js'
import { httpError } from '../http/problem.js'
import { getBasicListings, getListingForConversation } from './catalog.service.js'
import { getBasicUsers } from './identity.service.js'

export async function createOrGetConversation(userId: string, listingId: string) {
  const listing = await getListingForConversation(listingId)

  if (listing.sellerId === userId) {
    httpError({
      type: 'self-conversation',
      title: 'Invalid conversation',
      status: 409,
      detail: 'Users cannot start a conversation with themselves',
    })
  }

  const inserted = await db
    .insert(conversation)
    .values({
      listingId,
      buyerId: userId,
      sellerId: listing.sellerId,
    })
    .onConflictDoNothing({
      target: [conversation.listingId, conversation.buyerId, conversation.sellerId],
    })
    .returning()

  const current =
    inserted[0] ??
    (
      await db
        .select()
        .from(conversation)
        .where(
          and(
            eq(conversation.listingId, listingId),
            eq(conversation.buyerId, userId),
            eq(conversation.sellerId, listing.sellerId),
          ),
        )
        .limit(1)
    )[0]

  if (!current) {
    httpError({
      type: 'conversation-create-failed',
      title: 'Conversation create failed',
      status: 500,
      detail: 'Could not create or load conversation',
    })
  }

  await ensureReadStates(current.id, [current.buyerId, current.sellerId])

  return current
}

export async function listConversations(userId: string, limit: number) {
  const rows = await db
    .select()
    .from(conversation)
    .where(or(eq(conversation.buyerId, userId), eq(conversation.sellerId, userId)))
    .orderBy(desc(conversation.updatedAt))
    .limit(limit)

  const users = await getBasicUsers(
    rows.flatMap((row) => [row.buyerId, row.sellerId]),
  )
  const listings = await getBasicListings(rows.map((row) => row.listingId))

  return Promise.all(
    rows.map(async (row) => {
      const [lastMessage, readState] = await Promise.all([
        getLastMessage(row.id),
        getReadState(row.id, userId),
      ])

      const unreadCount = await countUnreadMessages(
        row.id,
        userId,
        readState?.lastReadAt ?? undefined,
      )

      return {
        ...row,
        lastMessage,
        unreadCount,
        buyer: users.get(row.buyerId) ?? null,
        seller: users.get(row.sellerId) ?? null,
        peer: users.get(row.buyerId === userId ? row.sellerId : row.buyerId) ?? null,
        listing: listings.get(row.listingId) ?? null,
      }
    }),
  )
}

export async function getConversationForUser(conversationId: string, userId: string) {
  const current = (
    await db
      .select()
      .from(conversation)
      .where(
        and(
          eq(conversation.id, conversationId),
          or(eq(conversation.buyerId, userId), eq(conversation.sellerId, userId)),
        ),
      )
      .limit(1)
  )[0]

  if (!current) {
    httpError({
      type: 'not-found',
      title: 'Conversation not found',
      status: 404,
      detail: 'Conversation does not exist or user is not a participant',
    })
  }

  return current
}

async function ensureReadStates(conversationId: string, userIds: string[]) {
  await db
    .insert(conversationReadState)
    .values(userIds.map((userId) => ({ conversationId, userId })))
    .onConflictDoNothing({
      target: [conversationReadState.conversationId, conversationReadState.userId],
    })
}

async function getLastMessage(conversationId: string) {
  return (
    await db
      .select()
      .from(message)
      .where(eq(message.conversationId, conversationId))
      .orderBy(desc(message.createdAt))
      .limit(1)
  )[0] ?? null
}

async function getReadState(conversationId: string, userId: string) {
  return (
    await db
      .select()
      .from(conversationReadState)
      .where(
        and(
          eq(conversationReadState.conversationId, conversationId),
          eq(conversationReadState.userId, userId),
        ),
      )
      .limit(1)
  )[0]
}

async function countUnreadMessages(
  conversationId: string,
  userId: string,
  lastReadAt?: Date,
) {
  const where = lastReadAt
    ? and(
        eq(message.conversationId, conversationId),
        ne(message.senderId, userId),
        gt(message.createdAt, lastReadAt),
      )
    : and(eq(message.conversationId, conversationId), ne(message.senderId, userId))

  const result = (
    await db.select({ value: count() }).from(message).where(where)
  )[0]

  return result?.value ?? 0
}
