
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, readerProfilesTable, readingSessionsTable, transactionsTable } from '../db/schema';
import { getReaderDashboard } from '../handlers/get_reader_dashboard';

describe('getReaderDashboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch complete reader dashboard data', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'reader@example.com',
        name: 'Test Reader',
        role: 'reader'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create reader profile
    await db.insert(readerProfilesTable)
      .values({
        user_id: userId,
        display_name: 'Mystic Reader',
        bio: 'Experienced tarot reader',
        specialties: ['tarot', 'astrology'],
        years_experience: 5,
        rating: '4.5',
        total_reviews: 100,
        is_online: true,
        is_available: true,
        chat_rate_per_minute: '2.50',
        phone_rate_per_minute: '4.00',
        video_rate_per_minute: '6.00',
        total_earnings: '1500.00',
        pending_payout: '250.00'
      })
      .execute();

    // Create client for sessions
    const clientResult = await db.insert(usersTable)
      .values({
        email: 'client@example.com',
        name: 'Test Client',
        role: 'client'
      })
      .returning()
      .execute();

    const clientId = clientResult[0].id;

    // Create recent sessions - insert chat session first, then video (video will be more recent)
    await db.insert(readingSessionsTable)
      .values({
        client_id: clientId,
        reader_id: userId,
        session_type: 'chat',
        status: 'completed',
        rate_per_minute: '2.50',
        duration_minutes: '30.0',
        total_cost: '75.00'
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(readingSessionsTable)
      .values({
        client_id: clientId,
        reader_id: userId,
        session_type: 'video',
        status: 'active',
        rate_per_minute: '6.00'
      })
      .execute();

    // Create recent transactions - insert reading_payment first, then payout (payout will be more recent)
    await db.insert(transactionsTable)
      .values({
        user_id: userId,
        type: 'reading_payment',
        status: 'completed',
        amount: '75.00',
        description: 'Payment for chat session'
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(transactionsTable)
      .values({
        user_id: userId,
        type: 'payout',
        status: 'pending',
        amount: '250.00',
        description: 'Weekly payout'
      })
      .execute();

    const result = await getReaderDashboard(userId);

    // Verify user data
    expect(result.user.id).toEqual(userId);
    expect(result.user.email).toEqual('reader@example.com');
    expect(result.user.name).toEqual('Test Reader');
    expect(result.user.role).toEqual('reader');

    // Verify profile data
    expect(result.profile.user_id).toEqual(userId);
    expect(result.profile.display_name).toEqual('Mystic Reader');
    expect(result.profile.bio).toEqual('Experienced tarot reader');
    expect(result.profile.specialties).toEqual(['tarot', 'astrology']);
    expect(result.profile.years_experience).toEqual(5);
    expect(result.profile.rating).toEqual(4.5);
    expect(result.profile.total_reviews).toEqual(100);
    expect(result.profile.is_online).toEqual(true);
    expect(result.profile.is_available).toEqual(true);
    expect(result.profile.chat_rate_per_minute).toEqual(2.50);
    expect(result.profile.phone_rate_per_minute).toEqual(4.00);
    expect(result.profile.video_rate_per_minute).toEqual(6.00);
    expect(result.profile.total_earnings).toEqual(1500.00);
    expect(result.profile.pending_payout).toEqual(250.00);

    // Verify recent sessions (ordered by created_at desc, so video should be first)
    expect(result.recentSessions).toHaveLength(2);
    expect(result.recentSessions[0].session_type).toEqual('video');
    expect(result.recentSessions[0].status).toEqual('active');
    expect(result.recentSessions[0].rate_per_minute).toEqual(6.00);
    expect(result.recentSessions[1].session_type).toEqual('chat');
    expect(result.recentSessions[1].status).toEqual('completed');
    expect(result.recentSessions[1].rate_per_minute).toEqual(2.50);
    expect(result.recentSessions[1].duration_minutes).toEqual(30.0);
    expect(result.recentSessions[1].total_cost).toEqual(75.00);

    // Verify earnings
    expect(result.earnings.today).toEqual(75.00);
    expect(result.earnings.thisWeek).toEqual(75.00);
    expect(result.earnings.thisMonth).toEqual(75.00);
    expect(result.earnings.pending).toEqual(250.00);

    // Verify recent transactions (ordered by created_at desc, so payout should be first)
    expect(result.recentTransactions).toHaveLength(2);
    expect(result.recentTransactions[0].type).toEqual('payout');
    expect(result.recentTransactions[0].status).toEqual('pending');
    expect(result.recentTransactions[0].amount).toEqual(250.00);
    expect(result.recentTransactions[1].type).toEqual('reading_payment');
    expect(result.recentTransactions[1].status).toEqual('completed');
    expect(result.recentTransactions[1].amount).toEqual(75.00);
  });

  it('should throw error when user not found', async () => {
    const nonExistentUserId = '550e8400-e29b-41d4-a716-446655440000';

    expect(getReaderDashboard(nonExistentUserId)).rejects.toThrow(/User not found/i);
  });

  it('should throw error when reader profile not found', async () => {
    // Create user but no reader profile
    const userResult = await db.insert(usersTable)
      .values({
        email: 'client@example.com',
        name: 'Test Client',
        role: 'client'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    expect(getReaderDashboard(userId)).rejects.toThrow(/Reader profile not found/i);
  });

  it('should handle reader with no sessions or transactions', async () => {
    // Create test user and profile only
    const userResult = await db.insert(usersTable)
      .values({
        email: 'newreader@example.com',
        name: 'New Reader',
        role: 'reader'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    await db.insert(readerProfilesTable)
      .values({
        user_id: userId,
        display_name: 'New Reader',
        bio: null,
        specialties: ['psychic'],
        years_experience: 0,
        chat_rate_per_minute: '3.00',
        phone_rate_per_minute: '5.00',
        video_rate_per_minute: '7.00'
      })
      .execute();

    const result = await getReaderDashboard(userId);

    expect(result.user.name).toEqual('New Reader');
    expect(result.profile.display_name).toEqual('New Reader');
    expect(result.profile.bio).toBeNull();
    expect(result.recentSessions).toHaveLength(0);
    expect(result.recentTransactions).toHaveLength(0);
    expect(result.earnings.today).toEqual(0);
    expect(result.earnings.thisWeek).toEqual(0);
    expect(result.earnings.thisMonth).toEqual(0);
    expect(result.earnings.pending).toEqual(0);
  });
});
