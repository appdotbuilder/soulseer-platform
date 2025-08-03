
import { db } from '../db';
import { liveStreamsTable } from '../db/schema';
import { type LiveStream } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getActiveStreams = async (): Promise<LiveStream[]> => {
  try {
    const results = await db.select()
      .from(liveStreamsTable)
      .where(eq(liveStreamsTable.status, 'live'))
      .orderBy(desc(liveStreamsTable.viewer_count), desc(liveStreamsTable.started_at))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(stream => ({
      ...stream,
      // viewer_count is integer, no conversion needed
      // All other fields are already correct types
    }));
  } catch (error) {
    console.error('Failed to fetch active streams:', error);
    throw error;
  }
};
