
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, readerProfilesTable, readingSessionsTable } from '../db/schema';
import { type CreateReadingSessionInput } from '../schema';
import { createReadingSession } from '../handlers/create_reading_session';
import { eq } from 'drizzle-orm';

describe('createReadingSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let clientId: string;
  let readerId: string;

  beforeEach(async () => {
    // Create test client
    const clientResult = await db.insert(usersTable)
      .values({
        email: 'client@test.com',
        name: 'Test Client',
        role: 'client'
      })
      .returning()
      .execute();
    clientId = clientResult[0].id;

    // Create test reader
    const readerResult = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      })
      .returning()
      .execute();
    readerId = readerResult[0].id;

    // Create reader profile
    await db.insert(readerProfilesTable)
      .values({
        user_id: readerId,
        display_name: 'Test Reader',
        bio: 'Experienced reader',
        specialties: ['tarot', 'astrology'],
        years_experience: 5,
        is_online: true,
        is_available: true,
        chat_rate_per_minute: '2.50',
        phone_rate_per_minute: '3.00',
        video_rate_per_minute: '4.00'
      })
      .execute();
  });

  it('should create a chat session successfully', async () => {
    const input: CreateReadingSessionInput = {
      client_id: clientId,
      reader_id: readerId,
      session_type: 'chat'
    };

    const result = await createReadingSession(input);

    expect(result.client_id).toEqual(clientId);
    expect(result.reader_id).toEqual(readerId);
    expect(result.session_type).toEqual('chat');
    expect(result.status).toEqual('pending');
    expect(result.rate_per_minute).toEqual(2.50);
    expect(result.duration_minutes).toBeNull();
    expect(result.total_cost).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.ended_at).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a phone session with correct rate', async () => {
    const input: CreateReadingSessionInput = {
      client_id: clientId,
      reader_id: readerId,
      session_type: 'phone'
    };

    const result = await createReadingSession(input);

    expect(result.session_type).toEqual('phone');
    expect(result.rate_per_minute).toEqual(3.00);
  });

  it('should create a video session with correct rate', async () => {
    const input: CreateReadingSessionInput = {
      client_id: clientId,
      reader_id: readerId,
      session_type: 'video'
    };

    const result = await createReadingSession(input);

    expect(result.session_type).toEqual('video');
    expect(result.rate_per_minute).toEqual(4.00);
  });

  it('should save session to database', async () => {
    const input: CreateReadingSessionInput = {
      client_id: clientId,
      reader_id: readerId,
      session_type: 'chat'
    };

    const result = await createReadingSession(input);

    const sessions = await db.select()
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].client_id).toEqual(clientId);
    expect(sessions[0].reader_id).toEqual(readerId);
    expect(sessions[0].session_type).toEqual('chat');
    expect(sessions[0].status).toEqual('pending');
    expect(parseFloat(sessions[0].rate_per_minute)).toEqual(2.50);
  });

  it('should throw error when client not found', async () => {
    const input: CreateReadingSessionInput = {
      client_id: '00000000-0000-0000-0000-000000000000',
      reader_id: readerId,
      session_type: 'chat'
    };

    expect(createReadingSession(input)).rejects.toThrow(/client not found/i);
  });

  it('should throw error when reader not found', async () => {
    const input: CreateReadingSessionInput = {
      client_id: clientId,
      reader_id: '00000000-0000-0000-0000-000000000000',
      session_type: 'chat'
    };

    expect(createReadingSession(input)).rejects.toThrow(/reader not found/i);
  });

  it('should throw error when reader is not available', async () => {
    // Make reader unavailable
    await db.update(readerProfilesTable)
      .set({ is_available: false })
      .where(eq(readerProfilesTable.user_id, readerId))
      .execute();

    const input: CreateReadingSessionInput = {
      client_id: clientId,
      reader_id: readerId,
      session_type: 'chat'
    };

    expect(createReadingSession(input)).rejects.toThrow(/not available/i);
  });

  it('should throw error when client has wrong role', async () => {
    // Update client to have admin role
    await db.update(usersTable)
      .set({ role: 'admin' })
      .where(eq(usersTable.id, clientId))
      .execute();

    const input: CreateReadingSessionInput = {
      client_id: clientId,
      reader_id: readerId,
      session_type: 'chat'
    };

    expect(createReadingSession(input)).rejects.toThrow(/invalid role/i);
  });

  it('should throw error when reader has wrong role', async () => {
    // Update reader to have client role
    await db.update(usersTable)
      .set({ role: 'client' })
      .where(eq(usersTable.id, readerId))
      .execute();

    const input: CreateReadingSessionInput = {
      client_id: clientId,
      reader_id: readerId,
      session_type: 'chat'
    };

    expect(createReadingSession(input)).rejects.toThrow(/invalid role/i);
  });
});
