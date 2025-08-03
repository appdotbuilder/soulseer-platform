
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, clientAccountsTable, readingSessionsTable, readerProfilesTable } from '../db/schema';
import { getClientDashboard } from '../handlers/get_client_dashboard';

// Test data setup
const createTestUser = async (role: 'client' | 'reader' = 'client', email?: string) => {
  const result = await db.insert(usersTable)
    .values({
      email: email || `test-${role}@example.com`,
      name: `Test ${role}`,
      role: role,
      avatar_url: null
    })
    .returning()
    .execute();
  return result[0];
};

const createTestClientAccount = async (userId: string, balance = 100.50, totalSpent = 250.75) => {
  const result = await db.insert(clientAccountsTable)
    .values({
      user_id: userId,
      balance: balance.toString(),
      total_spent: totalSpent.toString()
    })
    .returning()
    .execute();
  return result[0];
};

const createTestReaderProfile = async (userId: string) => {
  const result = await db.insert(readerProfilesTable)
    .values({
      user_id: userId,
      display_name: 'Test Reader',
      bio: 'Test bio',
      specialties: ['tarot', 'astrology'],
      years_experience: 5,
      chat_rate_per_minute: '2.50',
      phone_rate_per_minute: '3.50',
      video_rate_per_minute: '4.50'
    })
    .returning()
    .execute();
  return result[0];
};

const createTestSession = async (clientId: string, readerId: string, status: 'pending' | 'active' | 'completed' | 'cancelled' = 'completed') => {
  const result = await db.insert(readingSessionsTable)
    .values({
      client_id: clientId,
      reader_id: readerId,
      session_type: 'chat',
      status: status,
      rate_per_minute: '2.50',
      duration_minutes: status === 'completed' ? '15.5' : null,
      total_cost: status === 'completed' ? '38.75' : null
    })
    .returning()
    .execute();
  return result[0];
};

describe('getClientDashboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch complete dashboard data for a client', async () => {
    // Create test client
    const client = await createTestUser('client', 'client@example.com');
    const account = await createTestClientAccount(client.id, 150.25, 500.00);

    // Create test reader
    const reader = await createTestUser('reader', 'reader@example.com');
    await createTestReaderProfile(reader.id);

    // Create test sessions
    await createTestSession(client.id, reader.id, 'completed');
    await createTestSession(client.id, reader.id, 'completed');

    const result = await getClientDashboard(client.id);

    // Verify user data
    expect(result.user.id).toEqual(client.id);
    expect(result.user.email).toEqual('client@example.com');
    expect(result.user.name).toEqual('Test client');
    expect(result.user.role).toEqual('client');

    // Verify account data with numeric conversions
    expect(result.account.user_id).toEqual(client.id);
    expect(result.account.balance).toEqual(150.25);
    expect(result.account.total_spent).toEqual(500.00);
    expect(typeof result.account.balance).toBe('number');
    expect(typeof result.account.total_spent).toBe('number');

    // Verify recent sessions
    expect(result.recentSessions).toHaveLength(2);
    expect(result.recentSessions[0].client_id).toEqual(client.id);
    expect(result.recentSessions[0].reader_id).toEqual(reader.id);
    expect(result.recentSessions[0].status).toEqual('completed');
    expect(result.recentSessions[0].rate_per_minute).toEqual(2.50);
    expect(result.recentSessions[0].duration_minutes).toEqual(15.5);
    expect(result.recentSessions[0].total_cost).toEqual(38.75);
    expect(typeof result.recentSessions[0].rate_per_minute).toBe('number');

    // Verify favorite readers
    expect(result.favoriteReaders).toHaveLength(1);
    expect(result.favoriteReaders[0].id).toEqual(reader.id);
    expect(result.favoriteReaders[0].email).toEqual('reader@example.com');
  });

  it('should return empty arrays when no sessions exist', async () => {
    const client = await createTestUser('client');
    await createTestClientAccount(client.id);

    const result = await getClientDashboard(client.id);

    expect(result.user.id).toEqual(client.id);
    expect(result.account.user_id).toEqual(client.id);
    expect(result.recentSessions).toHaveLength(0);
    expect(result.favoriteReaders).toHaveLength(0);
  });

  it('should limit recent sessions to 10', async () => {
    const client = await createTestUser('client');
    await createTestClientAccount(client.id);
    const reader = await createTestUser('reader', 'reader@example.com');
    await createTestReaderProfile(reader.id);

    // Create 15 sessions
    for (let i = 0; i < 15; i++) {
      await createTestSession(client.id, reader.id, 'completed');
    }

    const result = await getClientDashboard(client.id);

    expect(result.recentSessions).toHaveLength(10);
  });

  it('should only include completed sessions for favorite readers calculation', async () => {
    const client = await createTestUser('client');
    await createTestClientAccount(client.id);
    const reader1 = await createTestUser('reader', 'reader1@example.com');
    const reader2 = await createTestUser('reader', 'reader2@example.com');
    await createTestReaderProfile(reader1.id);
    await createTestReaderProfile(reader2.id);

    // Reader1: 3 completed sessions
    await createTestSession(client.id, reader1.id, 'completed');
    await createTestSession(client.id, reader1.id, 'completed');
    await createTestSession(client.id, reader1.id, 'completed');

    // Reader2: 2 completed sessions + 1 cancelled (should not count)
    await createTestSession(client.id, reader2.id, 'completed');
    await createTestSession(client.id, reader2.id, 'completed');
    await createTestSession(client.id, reader2.id, 'cancelled');

    const result = await getClientDashboard(client.id);

    expect(result.favoriteReaders).toHaveLength(2);
    // Reader1 should be first (more completed sessions)
    expect(result.favoriteReaders[0].id).toEqual(reader1.id);
    expect(result.favoriteReaders[1].id).toEqual(reader2.id);
  });

  it('should throw error when user not found', async () => {
    const nonExistentUserId = '00000000-0000-0000-0000-000000000000';

    await expect(getClientDashboard(nonExistentUserId)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when client account not found', async () => {
    const client = await createTestUser('client');
    // Don't create client account

    await expect(getClientDashboard(client.id)).rejects.toThrow(/client account not found/i);
  });
});
