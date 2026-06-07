import { z } from 'zod'

export const uuidSchema = z.uuid()

export const conversationIdParamsSchema = z.object({
  conversationId: uuidSchema,
})

export const createConversationSchema = z.object({
  listingId: uuidSchema,
})

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
})

export const listMessagesQuerySchema = listQuerySchema.extend({
  before: z.iso.datetime().optional(),
})

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2_000),
})

export const markReadSchema = z.object({
  lastReadMessageId: uuidSchema.optional(),
})

export const joinConversationEventSchema = conversationIdParamsSchema

export const sendMessageEventSchema = conversationIdParamsSchema.merge(
  sendMessageSchema,
)

export const markReadEventSchema = conversationIdParamsSchema.merge(
  markReadSchema,
)

export const typingEventSchema = conversationIdParamsSchema
