
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, readingSessionsTable, clientAccountsTable, readerProfilesTable, transactionsTable } from '../db/schema';
import { type UpdateSessionStatusInput } from '../schema';
import { updateSessionStatus } from '../handlers/update_session_status';
import { eq } from 'drizzle-orm';

describe('updateSessionStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let clientUserId: string;
  let readerUserId: string;
  let sessionId: string;

  beforeEach(async () => {
    // Create test users
    const clientUsers = await db.insert(usersTable)
      .values({
        email: 'client@test.com',
        name: 'Test Client',
        role: 'client'
      })
      .returning()
      .execute();
    clientUserId = clientUsers[0].id;

    const readerUsers = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      })
      .returning()
      .execute();
    readerUserId = readerUsers[0].id;

    // Create client account with balance
    await db.insert(clientAccountsTable)
      .values({
        user_id: clientUserId,
        balance: '100.00'
      })
      .execute();

    // Create reader profile
    await db.insert(readerProfilesTable)
      .values({
        user_id: readerUserId,
        display_name: 'Test Reader',
        specialties: ['tarot', 'astrology'],
        years_experience: 5,
        chat_rate_per_minute: '2.50',
        phone_rate_per_minute: '3.00',
        video_rate_per_minute: '4.00'
      })
      .execute();

    // Create a test session
    const sessions = await db.insert(readingSessionsTable)
      .values({
        client_id: clientUserId,
        reader_id: readerUserId,
        session_type: 'chat',
        rate_per_minute: '2.50'
      })
      .returning()
      .execute();
    sessionId = sessions[0].id;
  });

  it('should update session status to active', async () => {
    const input: UpdateSessionStatusInput = {
      session_id: sessionId,
      status: 'active'
    };

    const result = await updateSessionStatus(input);

    expect(result.status).toEqual('active');
    expect(result.id).toEqual(sessionId);
    expect(result.ended_at).toBeNull();
  });

  it('should update session status to completed with duration and cost', async () => {
    const input: UpdateSessionStatusInput = {
      session_id: sessionId,
      status: 'completed',
      duration_minutes: 10,
      total_cost: 25.00
    };

    const result = await updateSessionStatus(input);

    expect(result.status).toEqual('completed');
    expect(result.duration_minutes).toEqual(10);
    expect(result.total_cost).toEqual(25.00);
    expect(result.ended_at).toBeInstanceOf(Date);
  });

  it('should calculate total cost when completing session with duration', async () => {
    const input: UpdateSessionStatusInput = {
      session_id: sessionId,
      status: 'completed',
      duration_minutes: 8 // 8 minutes * 2.50 = 20.00
    };

    const result = await updateSessionStatus(input);

    expect(result.status).toEqual('completed');
    expect(result.duration_minutes).toEqual(8);
    expect(result.total_cost).toEqual(20.00);
    expect(result.ended_at).toBeInstanceOf(Date);
  });

  it('should update client balance when session is completed', async () => {
    const input: UpdateSessionStatusInput = {
      session_id: sessionId,
      status: 'completed',
      duration_minutes: 10,
      total_cost: 25.00
    };

    await updateSessionStatus(input);

    // Check client account balance was reduced
    const clientAccounts = await db.select()
      .from(clientAccountsTable)
      .where(eq(clientAccountsTable.user_id, clientUserId))
      .execute();

    expect(clientAccounts).toHaveLength(1);
    expect(parseFloat(clientAccounts[0].balance)).toEqual(75.00); // 100 - 25
    expect(parseFloat(clientAccounts[0].total_spent)).toEqual(25.00);
  });

  it('should update reader earnings when session is completed', async () => {
    const input: UpdateSessionStatusInput = {
      session_id: sessionId,
      status: 'completed',
      duration_minutes: 10,
      total_cost: 25.00
    };

    await updateSessionStatus(input);

    // Check reader earnings were increased
    const readerProfiles = await db.select()
      .from(readerProfilesTable)
      .where(eq(readerProfilesTable.user_id, readerUserId))
      .execute();

    expect(readerProfiles).toHaveLength(1);
    expect(parseFloat(readerProfiles[0].total_earnings)).toEqual(25.00);
    expect(parseFloat(readerProfiles[0].pending_payout)).toEqual(25.00);
  });

  it('should create transaction record when session is completed', async () => {
    const input: UpdateSessionStatusInput = {
      session_id: sessionId,
      status: 'completed',
      duration_minutes: 10,
      total_cost: 25.00
    };

    await updateSessionStatus(input);

    // Check transaction was created
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.user_id, clientUserId))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toEqual('reading_payment');
    expect(transactions[0].status).toEqual('completed');
    expect(parseFloat(transactions[0].amount)).toEqual(25.00);
    expect(transactions[0].description).toContain('chat reading session');
  });

  it('should throw error for non-existent session', async () => {
    const input: UpdateSessionStatusInput = {
      session_id: '00000000-0000-0000-0000-000000000000',
      status: 'completed'
    };

    expect(updateSessionStatus(input)).rejects.toThrow(/not found/i);
  });

  it('should not process financial transactions for cancelled sessions', async () => {
    const input: UpdateSessionStatusInput = {
      session_id: sessionId,
      status: 'cancelled'
    };

    const result = await updateSessionStatus(input);

    expect(result.status).toEqual('cancelled');

    // Check no financial changes were made
    const clientAccounts = await db.select()
      .from(clientAccountsTable)
      .where(eq(clientAccountsTable.user_id, clientUserId))
      .execute();

    expect(parseFloat(clientAccounts[0].balance)).toEqual(100.00); // Unchanged
    expect(parseFloat(clientAccounts[0].total_spent)).toEqual(0.00); // Unchanged

    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.user_id, clientUserId))
      .execute();

    expect(transactions).toHaveLength(0); // No transactions created
  });
});
