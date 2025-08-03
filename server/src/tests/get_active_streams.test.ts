
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, liveStreamsTable } from '../db/schema';
import { getActiveStreams } from '../handlers/get_active_streams';

describe('getActiveStreams', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no live streams exist', async () => {
    const result = await getActiveStreams();
    expect(result).toEqual([]);
  });

  it('should return only live streams', async () => {
    // Create a test reader user
    const readerResult = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      })
      .returning()
      .execute();

    const readerId = readerResult[0].id;

    // Create streams with different statuses
    await db.insert(liveStreamsTable)
      .values([
        {
          reader_id: readerId,
          title: 'Live Stream 1',
          description: 'Currently live',
          status: 'live',
          viewer_count: 100
        },
        {
          reader_id: readerId,
          title: 'Scheduled Stream',
          description: 'Not yet live',
          status: 'scheduled',
          viewer_count: 0
        },
        {
          reader_id: readerId,
          title: 'Ended Stream',
          description: 'Already finished',
          status: 'ended',
          viewer_count: 50
        },
        {
          reader_id: readerId,
          title: 'Live Stream 2',
          description: 'Also live',
          status: 'live',
          viewer_count: 75
        }
      ])
      .execute();

    const result = await getActiveStreams();

    expect(result).toHaveLength(2);
    expect(result.every(stream => stream.status === 'live')).toBe(true);
    expect(result[0].title).toEqual('Live Stream 1');
    expect(result[1].title).toEqual('Live Stream 2');
  });

  it('should sort streams by viewer count and start time', async () => {
    // Create a test reader user
    const readerResult = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      })
      .returning()
      .execute();

    const readerId = readerResult[0].id;

    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

    // Create live streams with different viewer counts and start times
    await db.insert(liveStreamsTable)
      .values([
        {
          reader_id: readerId,
          title: 'Stream A',
          status: 'live',
          viewer_count: 50,
          started_at: now
        },
        {
          reader_id: readerId,
          title: 'Stream B',
          status: 'live',
          viewer_count: 100,
          started_at: earlier
        },
        {
          reader_id: readerId,
          title: 'Stream C',
          status: 'live',
          viewer_count: 75,
          started_at: now
        }
      ])
      .execute();

    const result = await getActiveStreams();

    expect(result).toHaveLength(3);
    // Should be sorted by viewer count descending, then by started_at descending
    expect(result[0].title).toEqual('Stream B'); // 100 viewers
    expect(result[1].title).toEqual('Stream C'); // 75 viewers
    expect(result[2].title).toEqual('Stream A'); // 50 viewers
    expect(result[0].viewer_count).toEqual(100);
    expect(result[1].viewer_count).toEqual(75);
    expect(result[2].viewer_count).toEqual(50);
  });

  it('should return streams with correct field types', async () => {
    // Create a test reader user
    const readerResult = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      })
      .returning()
      .execute();

    const readerId = readerResult[0].id;

    await db.insert(liveStreamsTable)
      .values({
        reader_id: readerId,
        title: 'Test Stream',
        description: 'Test description',
        status: 'live',
        viewer_count: 42
      })
      .execute();

    const result = await getActiveStreams();

    expect(result).toHaveLength(1);
    const stream = result[0];
    
    expect(typeof stream.id).toBe('string');
    expect(typeof stream.reader_id).toBe('string');
    expect(typeof stream.title).toBe('string');
    expect(typeof stream.description).toBe('string');
    expect(stream.status).toBe('live');
    expect(typeof stream.viewer_count).toBe('number');
    expect(stream.viewer_count).toBe(42);
    expect(stream.created_at).toBeInstanceOf(Date);
  });
});
