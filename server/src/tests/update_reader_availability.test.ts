
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, readerProfilesTable } from '../db/schema';
import { type UpdateReaderAvailabilityInput } from '../schema';
import { updateReaderAvailability } from '../handlers/update_reader_availability';
import { eq } from 'drizzle-orm';

describe('updateReaderAvailability', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update reader availability status', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create reader profile
    const profileResult = await db.insert(readerProfilesTable)
      .values({
        user_id: user.id,
        display_name: 'Test Reader',
        bio: 'Test bio',
        specialties: ['tarot', 'psychic'],
        years_experience: 5,
        is_online: false,
        is_available: false,
        chat_rate_per_minute: '5.00',
        phone_rate_per_minute: '8.00',
        video_rate_per_minute: '10.00'
      })
      .returning()
      .execute();

    const profile = profileResult[0];

    const input: UpdateReaderAvailabilityInput = {
      reader_id: profile.id,
      is_online: true,
      is_available: true
    };

    const result = await updateReaderAvailability(input);

    // Verify updated status
    expect(result.is_online).toBe(true);
    expect(result.is_available).toBe(true);
    expect(result.id).toEqual(profile.id);
    expect(result.user_id).toEqual(user.id);
    expect(result.display_name).toEqual('Test Reader');
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric fields are properly converted
    expect(typeof result.rating).toBe('number');
    expect(typeof result.chat_rate_per_minute).toBe('number');
    expect(typeof result.phone_rate_per_minute).toBe('number');
    expect(typeof result.video_rate_per_minute).toBe('number');
    expect(typeof result.total_earnings).toBe('number');
    expect(typeof result.pending_payout).toBe('number');
  });

  it('should save availability changes to database', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create reader profile
    const profileResult = await db.insert(readerProfilesTable)
      .values({
        user_id: user.id,
        display_name: 'Test Reader',
        bio: 'Test bio',
        specialties: ['tarot', 'psychic'],
        years_experience: 5,
        is_online: false,
        is_available: false,
        chat_rate_per_minute: '5.00',
        phone_rate_per_minute: '8.00',
        video_rate_per_minute: '10.00'
      })
      .returning()
      .execute();

    const profile = profileResult[0];

    const input: UpdateReaderAvailabilityInput = {
      reader_id: profile.id,
      is_online: true,
      is_available: true
    };

    await updateReaderAvailability(input);

    // Verify database was updated
    const profiles = await db.select()
      .from(readerProfilesTable)
      .where(eq(readerProfilesTable.id, profile.id))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].is_online).toBe(true);
    expect(profiles[0].is_available).toBe(true);
    expect(profiles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle going offline', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create reader profile - start online and available
    const profileResult = await db.insert(readerProfilesTable)
      .values({
        user_id: user.id,
        display_name: 'Test Reader',
        bio: 'Test bio',
        specialties: ['tarot', 'psychic'],
        years_experience: 5,
        is_online: true,
        is_available: true,
        chat_rate_per_minute: '5.00',
        phone_rate_per_minute: '8.00',
        video_rate_per_minute: '10.00'
      })
      .returning()
      .execute();

    const profile = profileResult[0];

    const input: UpdateReaderAvailabilityInput = {
      reader_id: profile.id,
      is_online: false,
      is_available: false
    };

    const result = await updateReaderAvailability(input);

    expect(result.is_online).toBe(false);
    expect(result.is_available).toBe(false);
  });

  it('should throw error for non-existent reader', async () => {
    const input: UpdateReaderAvailabilityInput = {
      reader_id: '00000000-0000-0000-0000-000000000000',
      is_online: true,
      is_available: true
    };

    await expect(updateReaderAvailability(input)).rejects.toThrow('Reader profile not found');
  });
});
