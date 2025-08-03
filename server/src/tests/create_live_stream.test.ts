
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, readerProfilesTable, liveStreamsTable } from '../db/schema';
import { type CreateLiveStreamInput } from '../schema';
import { createLiveStream } from '../handlers/create_live_stream';
import { eq } from 'drizzle-orm';

describe('createLiveStream', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let readerId: string;

  const setupReader = async () => {
    // Create a reader user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      })
      .returning()
      .execute();

    readerId = userResult[0].id;

    // Create reader profile
    await db.insert(readerProfilesTable)
      .values({
        user_id: readerId,
        display_name: 'Test Reader',
        bio: 'A test reader',
        specialties: ['tarot', 'astrology'],
        years_experience: 5,
        chat_rate_per_minute: '2.99',
        phone_rate_per_minute: '4.99',
        video_rate_per_minute: '6.99'
      })
      .execute();
  };

  it('should create an immediate live stream', async () => {
    await setupReader();

    const input: CreateLiveStreamInput = {
      reader_id: readerId,
      title: 'Live Tarot Reading',
      description: 'Join me for an interactive tarot session'
    };

    const result = await createLiveStream(input);

    expect(result.reader_id).toEqual(readerId);
    expect(result.title).toEqual('Live Tarot Reading');
    expect(result.description).toEqual('Join me for an interactive tarot session');
    expect(result.status).toEqual('live');
    expect(result.viewer_count).toEqual(0);
    expect(result.scheduled_at).toBeNull();
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.ended_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a scheduled live stream', async () => {
    await setupReader();

    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 2);

    const input: CreateLiveStreamInput = {
      reader_id: readerId,
      title: 'Scheduled Reading Session',
      description: 'Tomorrow evening session',
      scheduled_at: scheduledTime
    };

    const result = await createLiveStream(input);

    expect(result.reader_id).toEqual(readerId);
    expect(result.title).toEqual('Scheduled Reading Session');
    expect(result.description).toEqual('Tomorrow evening session');
    expect(result.status).toEqual('scheduled');
    expect(result.viewer_count).toEqual(0);
    expect(result.scheduled_at).toEqual(scheduledTime);
    expect(result.started_at).toBeNull();
    expect(result.ended_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save stream to database', async () => {
    await setupReader();

    const input: CreateLiveStreamInput = {
      reader_id: readerId,
      title: 'Test Stream',
      description: 'Testing database save'
    };

    const result = await createLiveStream(input);

    const streams = await db.select()
      .from(liveStreamsTable)
      .where(eq(liveStreamsTable.id, result.id))
      .execute();

    expect(streams).toHaveLength(1);
    expect(streams[0].reader_id).toEqual(readerId);
    expect(streams[0].title).toEqual('Test Stream');
    expect(streams[0].description).toEqual('Testing database save');
    expect(streams[0].status).toEqual('live');
    expect(streams[0].viewer_count).toEqual(0);
  });

  it('should throw error for non-existent reader', async () => {
    const input: CreateLiveStreamInput = {
      reader_id: '00000000-0000-0000-0000-000000000000',
      title: 'Test Stream',
      description: null
    };

    expect(createLiveStream(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error for non-reader user', async () => {
    // Create a client user (without reader profile)
    const clientResult = await db.insert(usersTable)
      .values({
        email: 'client@test.com',
        name: 'Test Client',
        role: 'client'
      })
      .returning()
      .execute();

    const input: CreateLiveStreamInput = {
      reader_id: clientResult[0].id,
      title: 'Test Stream',
      description: null
    };

    expect(createLiveStream(input)).rejects.toThrow(/not authorized/i);
  });

  it('should throw error when reader has active stream', async () => {
    await setupReader();

    // Create an active stream first
    await db.insert(liveStreamsTable)
      .values({
        reader_id: readerId,
        title: 'Existing Stream',
        description: 'Already active',
        status: 'live'
      })
      .execute();

    const input: CreateLiveStreamInput = {
      reader_id: readerId,
      title: 'New Stream',
      description: 'Should fail'
    };

    expect(createLiveStream(input)).rejects.toThrow(/already has an active/i);
  });

  it('should throw error when reader has scheduled stream', async () => {
    await setupReader();

    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 1);

    // Create a scheduled stream first
    await db.insert(liveStreamsTable)
      .values({
        reader_id: readerId,
        title: 'Scheduled Stream',
        description: 'Already scheduled',
        status: 'scheduled',
        scheduled_at: futureTime
      })
      .execute();

    const input: CreateLiveStreamInput = {
      reader_id: readerId,
      title: 'Another Stream',
      description: 'Should fail'
    };

    expect(createLiveStream(input)).rejects.toThrow(/already has an active/i);
  });

  it('should allow creating stream when previous stream ended', async () => {
    await setupReader();

    // Create an ended stream first
    await db.insert(liveStreamsTable)
      .values({
        reader_id: readerId,
        title: 'Ended Stream',
        description: 'This ended',
        status: 'ended',
        started_at: new Date(),
        ended_at: new Date()
      })
      .execute();

    const input: CreateLiveStreamInput = {
      reader_id: readerId,
      title: 'New Stream',
      description: 'Should succeed'
    };

    const result = await createLiveStream(input);

    expect(result.title).toEqual('New Stream');
    expect(result.status).toEqual('live');
  });
});
