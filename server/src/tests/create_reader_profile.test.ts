
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, readerProfilesTable } from '../db/schema';
import { type CreateReaderProfileInput } from '../schema';
import { createReaderProfile } from '../handlers/create_reader_profile';
import { eq } from 'drizzle-orm';

describe('createReaderProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testInput: CreateReaderProfileInput = {
    user_id: '00000000-0000-0000-0000-000000000001',
    display_name: 'Mystic Reader',
    bio: 'Experienced tarot reader with 10 years of practice',
    specialties: ['tarot', 'astrology', 'numerology'],
    years_experience: 10,
    chat_rate_per_minute: 2.50,
    phone_rate_per_minute: 3.75,
    video_rate_per_minute: 5.00
  };

  const createTestUser = async (role: 'client' | 'reader' | 'admin' = 'reader') => {
    await db.insert(usersTable)
      .values({
        id: testInput.user_id,
        email: 'reader@example.com',
        name: 'Test Reader',
        role: role
      })
      .execute();
  };

  it('should create a reader profile successfully', async () => {
    await createTestUser();

    const result = await createReaderProfile(testInput);

    expect(result.user_id).toEqual(testInput.user_id);
    expect(result.display_name).toEqual('Mystic Reader');
    expect(result.bio).toEqual('Experienced tarot reader with 10 years of practice');
    expect(result.specialties).toEqual(['tarot', 'astrology', 'numerology']);
    expect(result.years_experience).toEqual(10);
    expect(result.chat_rate_per_minute).toEqual(2.50);
    expect(result.phone_rate_per_minute).toEqual(3.75);
    expect(result.video_rate_per_minute).toEqual(5.00);
    expect(result.rating).toEqual(0);
    expect(result.total_reviews).toEqual(0);
    expect(result.is_online).toEqual(false);
    expect(result.is_available).toEqual(false);
    expect(result.total_earnings).toEqual(0);
    expect(result.pending_payout).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save reader profile to database', async () => {
    await createTestUser();

    const result = await createReaderProfile(testInput);

    const profiles = await db.select()
      .from(readerProfilesTable)
      .where(eq(readerProfilesTable.id, result.id))
      .execute();

    expect(profiles).toHaveLength(1);
    const profile = profiles[0];
    expect(profile.user_id).toEqual(testInput.user_id);
    expect(profile.display_name).toEqual('Mystic Reader');
    expect(profile.bio).toEqual('Experienced tarot reader with 10 years of practice');
    expect(profile.specialties).toEqual(['tarot', 'astrology', 'numerology']);
    expect(profile.years_experience).toEqual(10);
    expect(parseFloat(profile.chat_rate_per_minute)).toEqual(2.50);
    expect(parseFloat(profile.phone_rate_per_minute)).toEqual(3.75);
    expect(parseFloat(profile.video_rate_per_minute)).toEqual(5.00);
  });

  it('should validate numeric field types in response', async () => {
    await createTestUser();

    const result = await createReaderProfile(testInput);

    expect(typeof result.rating).toBe('number');
    expect(typeof result.chat_rate_per_minute).toBe('number');
    expect(typeof result.phone_rate_per_minute).toBe('number');
    expect(typeof result.video_rate_per_minute).toBe('number');
    expect(typeof result.total_earnings).toBe('number');
    expect(typeof result.pending_payout).toBe('number');
  });

  it('should throw error when user does not exist', async () => {
    await expect(createReaderProfile(testInput))
      .rejects.toThrow(/User with id .* does not exist/i);
  });

  it('should throw error when user is not a reader', async () => {
    await createTestUser('client');

    await expect(createReaderProfile(testInput))
      .rejects.toThrow(/User must have reader role/i);
  });

  it('should throw error when reader profile already exists', async () => {
    await createTestUser();
    await createReaderProfile(testInput);

    await expect(createReaderProfile(testInput))
      .rejects.toThrow(/Reader profile already exists/i);
  });

  it('should handle null bio correctly', async () => {
    await createTestUser();

    const inputWithNullBio = {
      ...testInput,
      bio: null
    };

    const result = await createReaderProfile(inputWithNullBio);

    expect(result.bio).toBeNull();
  });
});
