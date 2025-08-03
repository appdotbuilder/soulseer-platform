
import { db } from '../db';
import { liveStreamsTable, usersTable, readerProfilesTable } from '../db/schema';
import { type CreateLiveStreamInput, type LiveStream } from '../schema';
import { eq } from 'drizzle-orm';

export const createLiveStream = async (input: CreateLiveStreamInput): Promise<LiveStream> => {
  try {
    // First verify user exists and is a reader
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.reader_id))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];
    if (user.role !== 'reader') {
      throw new Error('User is not authorized to create live streams');
    }

    // Then verify reader has a profile
    const readerProfiles = await db.select()
      .from(readerProfilesTable)
      .where(eq(readerProfilesTable.user_id, input.reader_id))
      .execute();

    if (readerProfiles.length === 0) {
      throw new Error('Reader profile not found');
    }

    // Check if reader has an active stream
    const activeStreams = await db.select()
      .from(liveStreamsTable)
      .where(eq(liveStreamsTable.reader_id, input.reader_id))
      .execute();

    const hasActiveStream = activeStreams.some(stream => 
      stream.status === 'live' || stream.status === 'scheduled'
    );

    if (hasActiveStream) {
      throw new Error('Reader already has an active or scheduled stream');
    }

    // Determine stream status and timestamps
    const isScheduled = !!input.scheduled_at;
    const status = isScheduled ? 'scheduled' : 'live';
    const started_at = isScheduled ? null : new Date();

    // Create the live stream
    const result = await db.insert(liveStreamsTable)
      .values({
        reader_id: input.reader_id,
        title: input.title,
        description: input.description,
        status: status,
        scheduled_at: input.scheduled_at || null,
        started_at: started_at
      })
      .returning()
      .execute();

    const liveStream = result[0];
    return {
      ...liveStream,
      viewer_count: liveStream.viewer_count
    };
  } catch (error) {
    console.error('Live stream creation failed:', error);
    throw error;
  }
};
