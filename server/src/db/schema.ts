
import { pgTable, text, timestamp, boolean, numeric, integer, pgEnum, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['client', 'reader', 'admin']);
export const sessionTypeEnum = pgEnum('session_type', ['chat', 'phone', 'video']);
export const sessionStatusEnum = pgEnum('session_status', ['pending', 'active', 'completed', 'cancelled']);
export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'reading_payment', 'gift_purchase', 'product_purchase', 'payout']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'refunded']);
export const streamStatusEnum = pgEnum('stream_status', ['scheduled', 'live', 'ended']);
export const productTypeEnum = pgEnum('product_type', ['digital', 'physical', 'service']);
export const productStatusEnum = pgEnum('product_status', ['active', 'inactive', 'out_of_stock']);

// Users table
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull(),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Reader profiles table
export const readerProfilesTable = pgTable('reader_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => usersTable.id),
  display_name: text('display_name').notNull(),
  bio: text('bio'),
  specialties: jsonb('specialties').notNull().$type<string[]>(),
  years_experience: integer('years_experience').notNull(),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  total_reviews: integer('total_reviews').notNull().default(0),
  is_online: boolean('is_online').notNull().default(false),
  is_available: boolean('is_available').notNull().default(false),
  chat_rate_per_minute: numeric('chat_rate_per_minute', { precision: 10, scale: 2 }).notNull(),
  phone_rate_per_minute: numeric('phone_rate_per_minute', { precision: 10, scale: 2 }).notNull(),
  video_rate_per_minute: numeric('video_rate_per_minute', { precision: 10, scale: 2 }).notNull(),
  total_earnings: numeric('total_earnings', { precision: 12, scale: 2 }).notNull().default('0'),
  pending_payout: numeric('pending_payout', { precision: 12, scale: 2 }).notNull().default('0'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Client accounts table
export const clientAccountsTable = pgTable('client_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => usersTable.id),
  balance: numeric('balance', { precision: 10, scale: 2 }).notNull().default('0'),
  total_spent: numeric('total_spent', { precision: 12, scale: 2 }).notNull().default('0'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Reading sessions table
export const readingSessionsTable = pgTable('reading_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  client_id: uuid('client_id').notNull().references(() => usersTable.id),
  reader_id: uuid('reader_id').notNull().references(() => usersTable.id),
  session_type: sessionTypeEnum('session_type').notNull(),
  status: sessionStatusEnum('status').notNull().default('pending'),
  rate_per_minute: numeric('rate_per_minute', { precision: 10, scale: 2 }).notNull(),
  duration_minutes: numeric('duration_minutes', { precision: 8, scale: 2 }),
  total_cost: numeric('total_cost', { precision: 10, scale: 2 }),
  started_at: timestamp('started_at').defaultNow().notNull(),
  ended_at: timestamp('ended_at'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Session ratings table
export const sessionRatingsTable = pgTable('session_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  session_id: uuid('session_id').notNull().references(() => readingSessionsTable.id),
  client_id: uuid('client_id').notNull().references(() => usersTable.id),
  reader_id: uuid('reader_id').notNull().references(() => usersTable.id),
  rating: integer('rating').notNull(),
  review: text('review'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => usersTable.id),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').notNull().default('pending'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  stripe_payment_intent_id: text('stripe_payment_intent_id'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Live streams table
export const liveStreamsTable = pgTable('live_streams', {
  id: uuid('id').primaryKey().defaultRandom(),
  reader_id: uuid('reader_id').notNull().references(() => usersTable.id),
  title: text('title').notNull(),
  description: text('description'),
  status: streamStatusEnum('status').notNull().default('scheduled'),
  viewer_count: integer('viewer_count').notNull().default(0),
  scheduled_at: timestamp('scheduled_at'),
  started_at: timestamp('started_at'),
  ended_at: timestamp('ended_at'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Virtual gifts table
export const virtualGiftsTable = pgTable('virtual_gifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  image_url: text('image_url').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  animation_url: text('animation_url'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Gift transactions table
export const giftTransactionsTable = pgTable('gift_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  gift_id: uuid('gift_id').notNull().references(() => virtualGiftsTable.id),
  sender_id: uuid('sender_id').notNull().references(() => usersTable.id),
  receiver_id: uuid('receiver_id').notNull().references(() => usersTable.id),
  stream_id: uuid('stream_id').references(() => liveStreamsTable.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Products table
export const productsTable = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  type: productTypeEnum('type').notNull(),
  status: productStatusEnum('status').notNull().default('active'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  inventory_quantity: integer('inventory_quantity'),
  stripe_product_id: text('stripe_product_id'),
  created_by: uuid('created_by').references(() => usersTable.id),
  image_urls: jsonb('image_urls').notNull().$type<string[]>(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  readerProfile: one(readerProfilesTable),
  clientAccount: one(clientAccountsTable),
  readingSessions: many(readingSessionsTable),
  transactions: many(transactionsTable),
  liveStreams: many(liveStreamsTable),
  sentGifts: many(giftTransactionsTable, { relationName: 'sender' }),
  receivedGifts: many(giftTransactionsTable, { relationName: 'receiver' }),
  products: many(productsTable)
}));

export const readerProfilesRelations = relations(readerProfilesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [readerProfilesTable.user_id],
    references: [usersTable.id]
  }),
  readingSessions: many(readingSessionsTable),
  liveStreams: many(liveStreamsTable)
}));

export const clientAccountsRelations = relations(clientAccountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [clientAccountsTable.user_id],
    references: [usersTable.id]
  })
}));

export const readingSessionsRelations = relations(readingSessionsTable, ({ one, many }) => ({
  client: one(usersTable, {
    fields: [readingSessionsTable.client_id],
    references: [usersTable.id]
  }),
  reader: one(usersTable, {
    fields: [readingSessionsTable.reader_id],
    references: [usersTable.id]
  }),
  rating: one(sessionRatingsTable)
}));

export const sessionRatingsRelations = relations(sessionRatingsTable, ({ one }) => ({
  session: one(readingSessionsTable, {
    fields: [sessionRatingsTable.session_id],
    references: [readingSessionsTable.id]
  }),
  client: one(usersTable, {
    fields: [sessionRatingsTable.client_id],
    references: [usersTable.id]
  }),
  reader: one(usersTable, {
    fields: [sessionRatingsTable.reader_id],
    references: [usersTable.id]
  })
}));

export const liveStreamsRelations = relations(liveStreamsTable, ({ one, many }) => ({
  reader: one(usersTable, {
    fields: [liveStreamsTable.reader_id],
    references: [usersTable.id]
  }),
  giftTransactions: many(giftTransactionsTable)
}));

export const giftTransactionsRelations = relations(giftTransactionsTable, ({ one }) => ({
  gift: one(virtualGiftsTable, {
    fields: [giftTransactionsTable.gift_id],
    references: [virtualGiftsTable.id]
  }),
  sender: one(usersTable, {
    fields: [giftTransactionsTable.sender_id],
    references: [usersTable.id]
  }),
  receiver: one(usersTable, {
    fields: [giftTransactionsTable.receiver_id],
    references: [usersTable.id]
  }),
  stream: one(liveStreamsTable, {
    fields: [giftTransactionsTable.stream_id],
    references: [liveStreamsTable.id]
  })
}));

export const productsRelations = relations(productsTable, ({ one }) => ({
  creator: one(usersTable, {
    fields: [productsTable.created_by],
    references: [usersTable.id]
  })
}));

// Export all tables
export const tables = {
  users: usersTable,
  readerProfiles: readerProfilesTable,
  clientAccounts: clientAccountsTable,
  readingSessions: readingSessionsTable,
  sessionRatings: sessionRatingsTable,
  transactions: transactionsTable,
  liveStreams: liveStreamsTable,
  virtualGifts: virtualGiftsTable,
  giftTransactions: giftTransactionsTable,
  products: productsTable
};
