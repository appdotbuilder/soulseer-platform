
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, readerProfilesTable, readingSessionsTable, sessionRatingsTable } from '../db/schema';
import { type CreateSessionRatingInput } from '../schema';
import { createSessionRating } from '../handlers/create_session_rating';
import { eq } from 'drizzle-orm';

describe('createSessionRating', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let clientUser: any;
  let readerUser: any;
  let readerProfile: any;
  let completedSession: any;

  beforeEach(async () => {
    // Create test users
    const clientResult = await db.insert(usersTable)
      .values({
        email: 'client@test.com',
        name: 'Test Client',
        role: 'client'
      })
      .returning()
      .execute();
    clientUser = clientResult[0];

    const readerResult = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      })
      .returning()
      .execute();
    readerUser = readerResult[0];

    // Create reader profile
    const profileResult = await db.insert(readerProfilesTable)
      .values({
        user_id: readerUser.id,
        display_name: 'Test Reader',
        bio: 'Test bio',
        specialties: ['tarot', 'astrology'],
        years_experience: 5,
        chat_rate_per_minute: '2.99',
        phone_rate_per_minute: '3.99',
        video_rate_per_minute: '4.99',
        rating: '0',
        total_reviews: 0
      })
      .returning()
      .execute();
    readerProfile = profileResult[0];

    // Create completed session
    const sessionResult = await db.insert(readingSessionsTable)
      .values({
        client_id: clientUser.id,
        reader_id: readerUser.id,
        session_type: 'chat',
        status: 'completed',
        rate_per_minute: '2.99',
        duration_minutes: '30',
        total_cost: '89.70'
      })
      .returning()
      .execute();
    completedSession = sessionResult[0];
  });

  it('should create a session rating', async () => {
    const input: CreateSessionRatingInput = {
      session_id: completedSession.id,
      rating: 5,
      review: 'Amazing reading!'
    };

    const result = await createSessionRating(input);

    expect(result.session_id).toEqual(completedSession.id);
    expect(result.client_id).toEqual(clientUser.id);
    expect(result.reader_id).toEqual(readerUser.id);
    expect(result.rating).toEqual(5);
    expect(result.review).toEqual('Amazing reading!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save rating to database', async () => {
    const input: CreateSessionRatingInput = {
      session_id: completedSession.id,
      rating: 4,
      review: 'Great session'
    };

    const result = await createSessionRating(input);

    const ratings = await db.select()
      .from(sessionRatingsTable)
      .where(eq(sessionRatingsTable.id, result.id))
      .execute();

    expect(ratings).toHaveLength(1);
    expect(ratings[0].session_id).toEqual(completedSession.id);
    expect(ratings[0].rating).toEqual(4);
    expect(ratings[0].review).toEqual('Great session');
  });

  it('should update reader profile rating and review count', async () => {
    const input: CreateSessionRatingInput = {
      session_id: completedSession.id,
      rating: 4,
      review: 'Good reading'
    };

    await createSessionRating(input);

    const updatedProfiles = await db.select()
      .from(readerProfilesTable)
      .where(eq(readerProfilesTable.user_id, readerUser.id))
      .execute();

    const updatedProfile = updatedProfiles[0];
    expect(parseFloat(updatedProfile.rating)).toEqual(4);
    expect(updatedProfile.total_reviews).toEqual(1);
    expect(updatedProfile.updated_at).toBeInstanceOf(Date);
  });

  it('should calculate correct average rating with multiple reviews', async () => {
    // First rating
    const firstInput: CreateSessionRatingInput = {
      session_id: completedSession.id,
      rating: 5,
      review: 'Excellent'
    };

    await createSessionRating(firstInput);

    // Create another completed session
    const secondSessionResult = await db.insert(readingSessionsTable)
      .values({
        client_id: clientUser.id,
        reader_id: readerUser.id,
        session_type: 'phone',
        status: 'completed',
        rate_per_minute: '3.99',
        duration_minutes: '20',
        total_cost: '79.80'
      })
      .returning()
      .execute();

    // Second rating
    const secondInput: CreateSessionRatingInput = {
      session_id: secondSessionResult[0].id,
      rating: 3,
      review: 'Okay reading'
    };

    await createSessionRating(secondInput);

    const updatedProfiles = await db.select()
      .from(readerProfilesTable)
      .where(eq(readerProfilesTable.user_id, readerUser.id))
      .execute();

    const updatedProfile = updatedProfiles[0];
    expect(parseFloat(updatedProfile.rating)).toEqual(4); // (5 + 3) / 2 = 4
    expect(updatedProfile.total_reviews).toEqual(2);
  });

  it('should throw error if session does not exist', async () => {
    const input: CreateSessionRatingInput = {
      session_id: '00000000-0000-0000-0000-000000000000',
      rating: 5,
      review: 'Great!'
    };

    await expect(createSessionRating(input)).rejects.toThrow(/session not found/i);
  });

  it('should throw error if session is not completed', async () => {
    // Create pending session
    const pendingSessionResult = await db.insert(readingSessionsTable)
      .values({
        client_id: clientUser.id,
        reader_id: readerUser.id,
        session_type: 'chat',
        status: 'pending',
        rate_per_minute: '2.99'
      })
      .returning()
      .execute();

    const input: CreateSessionRatingInput = {
      session_id: pendingSessionResult[0].id,
      rating: 5,
      review: 'Great!'
    };

    await expect(createSessionRating(input)).rejects.toThrow(/session must be completed/i);
  });

  it('should throw error if session already rated', async () => {
    const input: CreateSessionRatingInput = {
      session_id: completedSession.id,
      rating: 5,
      review: 'First rating'
    };

    // Create first rating
    await createSessionRating(input);

    // Try to create second rating for same session
    const duplicateInput: CreateSessionRatingInput = {
      session_id: completedSession.id,
      rating: 3,
      review: 'Second rating'
    };

    await expect(createSessionRating(duplicateInput)).rejects.toThrow(/already been rated/i);
  });

  it('should handle rating without review', async () => {
    const input: CreateSessionRatingInput = {
      session_id: completedSession.id,
      rating: 4,
      review: null
    };

    const result = await createSessionRating(input);

    expect(result.rating).toEqual(4);
    expect(result.review).toBeNull();
  });
});
