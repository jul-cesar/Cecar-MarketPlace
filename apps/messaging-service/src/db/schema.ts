import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const conversationStatus = pgEnum('conversation_status', [
  'ACTIVE',
  'ARCHIVED',
  'BLOCKED',
])

export const messageStatus = pgEnum('message_status', ['SENT', 'DELETED'])

export const conversation = pgTable(
  'conversation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    listingId: uuid('listing_id').notNull(),
    buyerId: text('buyer_id').notNull(),
    sellerId: text('seller_id').notNull(),
    status: conversationStatus('status').notNull().default('ACTIVE'),
    lastMessageId: uuid('last_message_id'),
    lastMessageAt: timestamp('last_message_at', {
      precision: 6,
      withTimezone: true,
    }),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('ux_conversation_listing_buyer_seller').on(
      table.listingId,
      table.buyerId,
      table.sellerId,
    ),
    index('idx_conversation_buyer_updated').on(table.buyerId, table.updatedAt),
    index('idx_conversation_seller_updated').on(
      table.sellerId,
      table.updatedAt,
    ),
    index('idx_conversation_listing').on(table.listingId),
  ],
)

export const message = pgTable(
  'message',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    senderId: text('sender_id').notNull(),
    body: text('body').notNull(),
    status: messageStatus('status').notNull().default('SENT'),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_message_conversation_created').on(
      table.conversationId,
      table.createdAt,
    ),
    index('idx_message_sender').on(table.senderId),
  ],
)

export const conversationReadState = pgTable(
  'conversation_read_state',
  {
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    lastReadMessageId: uuid('last_read_message_id'),
    lastReadAt: timestamp('last_read_at', {
      precision: 6,
      withTimezone: true,
    }),
    muted: boolean('muted').notNull().default(false),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.conversationId, table.userId],
      name: 'pk_conversation_read_state',
    }),
    index('idx_conversation_read_state_user').on(table.userId),
  ],
)

export const conversationRelations = relations(conversation, ({ many }) => ({
  messages: many(message),
  readStates: many(conversationReadState),
}))

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
}))

export const conversationReadStateRelations = relations(
  conversationReadState,
  ({ one }) => ({
    conversation: one(conversation, {
      fields: [conversationReadState.conversationId],
      references: [conversation.id],
    }),
  }),
)
