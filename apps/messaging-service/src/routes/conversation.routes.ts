import { Hono } from 'hono'
import { requireUser, type AppBindings } from '../http/auth.js'
import {
  validateJson,
  validateParams,
  validateQuery,
} from '../http/validation.js'
import {
  conversationIdParamsSchema,
  createConversationSchema,
  listMessagesQuerySchema,
  listQuerySchema,
  markReadSchema,
  sendMessageSchema,
} from '../schemas/messaging.schemas.js'
import {
  createOrGetConversation,
  listConversations,
} from '../services/conversation.service.js'
import {
  listMessages,
  markConversationRead,
  sendMessage,
} from '../services/message.service.js'

export const conversationRoutes = new Hono<AppBindings>()

conversationRoutes.use('*', requireUser)

conversationRoutes.post('/', async (c) => {
  const user = c.get('user')
  const { listingId } = await validateJson(c, createConversationSchema)
  const result = await createOrGetConversation(user.id, listingId)

  return c.json(result, 201)
})

conversationRoutes.get('/', async (c) => {
  const user = c.get('user')
  const { limit } = validateQuery(c, listQuerySchema)
  const result = await listConversations(user.id, limit)

  return c.json({ data: result })
})

conversationRoutes.get('/:conversationId/messages', async (c) => {
  const user = c.get('user')
  const { conversationId } = validateParams(c, conversationIdParamsSchema)
  const { limit, before } = validateQuery(c, listMessagesQuerySchema)

  const result = await listMessages(conversationId, user.id, {
    limit,
    before: before ? new Date(before) : undefined,
  })

  return c.json({ data: result })
})

conversationRoutes.post('/:conversationId/messages', async (c) => {
  const user = c.get('user')
  const { conversationId } = validateParams(c, conversationIdParamsSchema)
  const { body } = await validateJson(c, sendMessageSchema)
  const result = await sendMessage(conversationId, user.id, body)

  return c.json(result, 201)
})

conversationRoutes.patch('/:conversationId/read', async (c) => {
  const user = c.get('user')
  const { conversationId } = validateParams(c, conversationIdParamsSchema)
  const { lastReadMessageId } = await validateJson(c, markReadSchema)
  const result = await markConversationRead(conversationId, user.id, lastReadMessageId)

  return c.json(result)
})
