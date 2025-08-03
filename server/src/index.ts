
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createReaderProfileInputSchema,
  createReadingSessionInputSchema,
  updateSessionStatusInputSchema,
  createSessionRatingInputSchema,
  addFundsInputSchema,
  createLiveStreamInputSchema,
  sendVirtualGiftInputSchema,
  createProductInputSchema,
  updateReaderAvailabilityInputSchema
} from './schema';

// Import handlers
import { createReaderProfile } from './handlers/create_reader_profile';
import { getOnlineReaders } from './handlers/get_online_readers';
import { createReadingSession } from './handlers/create_reading_session';
import { updateSessionStatus } from './handlers/update_session_status';
import { addClientFunds } from './handlers/add_client_funds';
import { createSessionRating } from './handlers/create_session_rating';
import { updateReaderAvailability } from './handlers/update_reader_availability';
import { createLiveStream } from './handlers/create_live_stream';
import { getActiveStreams } from './handlers/get_active_streams';
import { sendVirtualGift } from './handlers/send_virtual_gift';
import { getVirtualGifts } from './handlers/get_virtual_gifts';
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { getClientDashboard } from './handlers/get_client_dashboard';
import { getReaderDashboard } from './handlers/get_reader_dashboard';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Reader management
  createReaderProfile: publicProcedure
    .input(createReaderProfileInputSchema)
    .mutation(({ input }) => createReaderProfile(input)),

  getOnlineReaders: publicProcedure
    .query(() => getOnlineReaders()),

  updateReaderAvailability: publicProcedure
    .input(updateReaderAvailabilityInputSchema)
    .mutation(({ input }) => updateReaderAvailability(input)),

  // Reading sessions
  createReadingSession: publicProcedure
    .input(createReadingSessionInputSchema)
    .mutation(({ input }) => createReadingSession(input)),

  updateSessionStatus: publicProcedure
    .input(updateSessionStatusInputSchema)
    .mutation(({ input }) => updateSessionStatus(input)),

  createSessionRating: publicProcedure
    .input(createSessionRatingInputSchema)
    .mutation(({ input }) => createSessionRating(input)),

  // Client account management
  addClientFunds: publicProcedure
    .input(addFundsInputSchema)
    .mutation(({ input }) => addClientFunds(input)),

  // Live streaming
  createLiveStream: publicProcedure
    .input(createLiveStreamInputSchema)
    .mutation(({ input }) => createLiveStream(input)),

  getActiveStreams: publicProcedure
    .query(() => getActiveStreams()),

  // Virtual gifts
  sendVirtualGift: publicProcedure
    .input(sendVirtualGiftInputSchema)
    .mutation(({ input }) => sendVirtualGift(input)),

  getVirtualGifts: publicProcedure
    .query(() => getVirtualGifts()),

  // Marketplace
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  getProducts: publicProcedure
    .query(() => getProducts()),

  // Dashboards
  getClientDashboard: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getClientDashboard(input.userId)),

  getReaderDashboard: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getReaderDashboard(input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`SoulSeer TRPC server listening at port: ${port}`);
}

start();
