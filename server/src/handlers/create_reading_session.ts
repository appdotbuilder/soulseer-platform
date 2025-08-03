
import { db } from '../db';
import { readingSessionsTable, usersTable, readerProfilesTable } from '../db/schema';
import { type CreateReadingSessionInput, type ReadingSession } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createReadingSession = async (input: CreateReadingSessionInput): Promise<ReadingSession> => {
  try {
    // Validate that client exists and has client role
    const clientResult = await db.select()
      .from(usersTable)
      .where(and(
        eq(usersTable.id, input.client_id),
        eq(usersTable.role, 'client')
      ))
      .execute();

    if (clientResult.length === 0) {
      throw new Error('Client not found or invalid role');
    }

    // Validate that reader exists, has reader role, and is available
    const readerResult = await db.select()
      .from(usersTable)
      .innerJoin(readerProfilesTable, eq(usersTable.id, readerProfilesTable.user_id))
      .where(and(
        eq(usersTable.id, input.reader_id),
        eq(usersTable.role, 'reader'),
        eq(readerProfilesTable.is_available, true)
      ))
      .execute();

    if (readerResult.length === 0) {
      throw new Error('Reader not found, invalid role, or not available');
    }

    const readerProfile = readerResult[0].reader_profiles;

    // Get the appropriate rate based on session type
    let ratePerMinute: number;
    switch (input.session_type) {
      case 'chat':
        ratePerMinute = parseFloat(readerProfile.chat_rate_per_minute);
        break;
      case 'phone':
        ratePerMinute = parseFloat(readerProfile.phone_rate_per_minute);
        break;
      case 'video':
        ratePerMinute = parseFloat(readerProfile.video_rate_per_minute);
        break;
      default:
        throw new Error('Invalid session type');
    }

    // Create the reading session
    const result = await db.insert(readingSessionsTable)
      .values({
        client_id: input.client_id,
        reader_id: input.reader_id,
        session_type: input.session_type,
        status: 'pending',
        rate_per_minute: ratePerMinute.toString()
      })
      .returning()
      .execute();

    const session = result[0];
    return {
      ...session,
      rate_per_minute: parseFloat(session.rate_per_minute),
      duration_minutes: session.duration_minutes ? parseFloat(session.duration_minutes) : null,
      total_cost: session.total_cost ? parseFloat(session.total_cost) : null
    };
  } catch (error) {
    console.error('Reading session creation failed:', error);
    throw error;
  }
};
