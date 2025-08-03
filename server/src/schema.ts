
import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['client', 'reader', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: userRoleSchema,
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Reader profile schema
export const readerProfileSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  display_name: z.string(),
  bio: z.string().nullable(),
  specialties: z.array(z.string()),
  years_experience: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  total_reviews: z.number().int().nonnegative(),
  is_online: z.boolean(),
  is_available: z.boolean(),
  chat_rate_per_minute: z.number().positive(),
  phone_rate_per_minute: z.number().positive(),
  video_rate_per_minute: z.number().positive(),
  total_earnings: z.number().nonnegative(),
  pending_payout: z.number().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ReaderProfile = z.infer<typeof readerProfileSchema>;

// Client account schema
export const clientAccountSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  balance: z.number().nonnegative(),
  total_spent: z.number().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ClientAccount = z.infer<typeof clientAccountSchema>;

// Reading session schema
export const sessionTypeSchema = z.enum(['chat', 'phone', 'video']);
export const sessionStatusSchema = z.enum(['pending', 'active', 'completed', 'cancelled']);

export const readingSessionSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  reader_id: z.string(),
  session_type: sessionTypeSchema,
  status: sessionStatusSchema,
  rate_per_minute: z.number().positive(),
  duration_minutes: z.number().nonnegative().nullable(),
  total_cost: z.number().nonnegative().nullable(),
  started_at: z.coerce.date(),
  ended_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type ReadingSession = z.infer<typeof readingSessionSchema>;

// Session rating schema
export const sessionRatingSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  client_id: z.string(),
  reader_id: z.string(),
  rating: z.number().int().min(1).max(5),
  review: z.string().nullable(),
  created_at: z.coerce.date()
});

export type SessionRating = z.infer<typeof sessionRatingSchema>;

// Transaction schema
export const transactionTypeSchema = z.enum(['deposit', 'reading_payment', 'gift_purchase', 'product_purchase', 'payout']);
export const transactionStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded']);

export const transactionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  amount: z.number(),
  description: z.string(),
  stripe_payment_intent_id: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Live stream schema
export const streamStatusSchema = z.enum(['scheduled', 'live', 'ended']);

export const liveStreamSchema = z.object({
  id: z.string(),
  reader_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: streamStatusSchema,
  viewer_count: z.number().int().nonnegative(),
  scheduled_at: z.coerce.date().nullable(),
  started_at: z.coerce.date().nullable(),
  ended_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type LiveStream = z.infer<typeof liveStreamSchema>;

// Virtual gift schema
export const virtualGiftSchema = z.object({
  id: z.string(),
  name: z.string(),
  image_url: z.string(),
  price: z.number().positive(),
  animation_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type VirtualGift = z.infer<typeof virtualGiftSchema>;

// Gift transaction schema
export const giftTransactionSchema = z.object({
  id: z.string(),
  gift_id: z.string(),
  sender_id: z.string(),
  receiver_id: z.string(),
  stream_id: z.string().nullable(),
  amount: z.number().positive(),
  created_at: z.coerce.date()
});

export type GiftTransaction = z.infer<typeof giftTransactionSchema>;

// Product schema
export const productTypeSchema = z.enum(['digital', 'physical', 'service']);
export const productStatusSchema = z.enum(['active', 'inactive', 'out_of_stock']);

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: productTypeSchema,
  status: productStatusSchema,
  price: z.number().positive(),
  inventory_quantity: z.number().int().nonnegative().nullable(),
  stripe_product_id: z.string().nullable(),
  created_by: z.string().nullable(),
  image_urls: z.array(z.string()),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Input schemas for creating entities
export const createReaderProfileInputSchema = z.object({
  user_id: z.string(),
  display_name: z.string(),
  bio: z.string().nullable(),
  specialties: z.array(z.string()),
  years_experience: z.number().int().nonnegative(),
  chat_rate_per_minute: z.number().positive(),
  phone_rate_per_minute: z.number().positive(),
  video_rate_per_minute: z.number().positive()
});

export type CreateReaderProfileInput = z.infer<typeof createReaderProfileInputSchema>;

export const createReadingSessionInputSchema = z.object({
  client_id: z.string(),
  reader_id: z.string(),
  session_type: sessionTypeSchema
});

export type CreateReadingSessionInput = z.infer<typeof createReadingSessionInputSchema>;

export const updateSessionStatusInputSchema = z.object({
  session_id: z.string(),
  status: sessionStatusSchema,
  duration_minutes: z.number().nonnegative().optional(),
  total_cost: z.number().nonnegative().optional()
});

export type UpdateSessionStatusInput = z.infer<typeof updateSessionStatusInputSchema>;

export const createSessionRatingInputSchema = z.object({
  session_id: z.string(),
  rating: z.number().int().min(1).max(5),
  review: z.string().nullable()
});

export type CreateSessionRatingInput = z.infer<typeof createSessionRatingInputSchema>;

export const addFundsInputSchema = z.object({
  user_id: z.string(),
  amount: z.number().positive(),
  payment_method_id: z.string()
});

export type AddFundsInput = z.infer<typeof addFundsInputSchema>;

export const createLiveStreamInputSchema = z.object({
  reader_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  scheduled_at: z.coerce.date().optional()
});

export type CreateLiveStreamInput = z.infer<typeof createLiveStreamInputSchema>;

export const sendVirtualGiftInputSchema = z.object({
  gift_id: z.string(),
  sender_id: z.string(),
  receiver_id: z.string(),
  stream_id: z.string().nullable()
});

export type SendVirtualGiftInput = z.infer<typeof sendVirtualGiftInputSchema>;

export const createProductInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: productTypeSchema,
  price: z.number().positive(),
  inventory_quantity: z.number().int().nonnegative().nullable(),
  created_by: z.string().nullable(),
  image_urls: z.array(z.string())
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateReaderAvailabilityInputSchema = z.object({
  reader_id: z.string(),
  is_online: z.boolean(),
  is_available: z.boolean()
});

export type UpdateReaderAvailabilityInput = z.infer<typeof updateReaderAvailabilityInputSchema>;
