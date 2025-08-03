
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, readerProfilesTable } from '../db/schema';
import { getOnlineReaders } from '../handlers/get_online_readers';

describe('getOnlineReaders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only online and available readers', async () => {
    // Create test users
    const [reader1, reader2, reader3] = await db.insert(usersTable)
      .values([
        {
          email: 'reader1@test.com',
          name: 'Reader One',
          role: 'reader'
        },
        {
          email: 'reader2@test.com',
          name: 'Reader Two',
          role: 'reader'
        },
        {
          email: 'reader3@test.com',
          name: 'Reader Three',
          role: 'reader'
        }
      ])
      .returning()
      .execute();

    // Create reader profiles with different online/availability status
    await db.insert(readerProfilesTable)
      .values([
        {
          user_id: reader1.id,
          display_name: 'Online Available Reader',
          specialties: ['tarot', 'love'],
          years_experience: 5,
          rating: '4.8',
          total_reviews: 100,
          is_online: true,
          is_available: true,
          chat_rate_per_minute: '2.50',
          phone_rate_per_minute: '3.00',
          video_rate_per_minute: '4.00'
        },
        {
          user_id: reader2.id,
          display_name: 'Online Busy Reader',
          specialties: ['psychic'],
          years_experience: 3,
          rating: '4.5',
          total_reviews: 50,
          is_online: true,
          is_available: false, // Busy - should not appear
          chat_rate_per_minute: '1.50',
          phone_rate_per_minute: '2.00',
          video_rate_per_minute: '3.00'
        },
        {
          user_id: reader3.id,
          display_name: 'Offline Reader',
          specialties: ['astrology'],
          years_experience: 8,
          rating: '4.9',
          total_reviews: 200,
          is_online: false, // Offline - should not appear
          is_available: true,
          chat_rate_per_minute: '3.00',
          phone_rate_per_minute: '4.00',
          video_rate_per_minute: '5.00'
        }
      ])
      .execute();

    const results = await getOnlineReaders();

    // Should only return the online and available reader
    expect(results).toHaveLength(1);
    expect(results[0].display_name).toEqual('Online Available Reader');
    expect(results[0].is_online).toBe(true);
    expect(results[0].is_available).toBe(true);
    expect(results[0].user_id).toEqual(reader1.id);
  });

  it('should return readers ordered by rating and total reviews', async () => {
    // Create test users
    const [reader1, reader2, reader3] = await db.insert(usersTable)
      .values([
        {
          email: 'reader1@test.com',
          name: 'Reader One',
          role: 'reader'
        },
        {
          email: 'reader2@test.com',
          name: 'Reader Two',
          role: 'reader'
        },
        {
          email: 'reader3@test.com',
          name: 'Reader Three',
          role: 'reader'
        }
      ])
      .returning()
      .execute();

    // Create multiple online readers with different ratings
    await db.insert(readerProfilesTable)
      .values([
        {
          user_id: reader1.id,
          display_name: 'Lower Rated Reader',
          specialties: ['tarot'],
          years_experience: 2,
          rating: '4.2',
          total_reviews: 30,
          is_online: true,
          is_available: true,
          chat_rate_per_minute: '2.00',
          phone_rate_per_minute: '2.50',
          video_rate_per_minute: '3.50'
        },
        {
          user_id: reader2.id,
          display_name: 'Top Rated Reader',
          specialties: ['psychic', 'love'],
          years_experience: 10,
          rating: '4.9',
          total_reviews: 150,
          is_online: true,
          is_available: true,
          chat_rate_per_minute: '3.00',
          phone_rate_per_minute: '3.50',
          video_rate_per_minute: '4.50'
        },
        {
          user_id: reader3.id,
          display_name: 'Same Rating More Reviews',
          specialties: ['astrology'],
          years_experience: 7,
          rating: '4.9',
          total_reviews: 200,
          is_online: true,
          is_available: true,
          chat_rate_per_minute: '2.75',
          phone_rate_per_minute: '3.25',
          video_rate_per_minute: '4.25'
        }
      ])
      .execute();

    const results = await getOnlineReaders();

    expect(results).toHaveLength(3);
    // Should be ordered by rating desc, then total_reviews desc
    expect(results[0].display_name).toEqual('Same Rating More Reviews'); // 4.9 rating, 200 reviews
    expect(results[1].display_name).toEqual('Top Rated Reader'); // 4.9 rating, 150 reviews
    expect(results[2].display_name).toEqual('Lower Rated Reader'); // 4.2 rating, 30 reviews
  });

  it('should convert numeric fields correctly', async () => {
    // Create test user
    const [reader] = await db.insert(usersTable)
      .values([{
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      }])
      .returning()
      .execute();

    // Create reader profile
    await db.insert(readerProfilesTable)
      .values([{
        user_id: reader.id,
        display_name: 'Test Reader',
        specialties: ['tarot'],
        years_experience: 5,
        rating: '4.75',
        total_reviews: 80,
        is_online: true,
        is_available: true,
        chat_rate_per_minute: '2.99',
        phone_rate_per_minute: '3.49',
        video_rate_per_minute: '4.99',
        total_earnings: '1250.50',
        pending_payout: '125.25'
      }])
      .execute();

    const results = await getOnlineReaders();

    expect(results).toHaveLength(1);
    const reader_profile = results[0];

    // Verify numeric fields are converted to numbers
    expect(typeof reader_profile.rating).toBe('number');
    expect(reader_profile.rating).toEqual(4.75);
    expect(typeof reader_profile.chat_rate_per_minute).toBe('number');
    expect(reader_profile.chat_rate_per_minute).toEqual(2.99);
    expect(typeof reader_profile.phone_rate_per_minute).toBe('number');
    expect(reader_profile.phone_rate_per_minute).toEqual(3.49);
    expect(typeof reader_profile.video_rate_per_minute).toBe('number');
    expect(reader_profile.video_rate_per_minute).toEqual(4.99);
    expect(typeof reader_profile.total_earnings).toBe('number');
    expect(reader_profile.total_earnings).toEqual(1250.50);
    expect(typeof reader_profile.pending_payout).toBe('number');
    expect(reader_profile.pending_payout).toEqual(125.25);
  });

  it('should return empty array when no online readers available', async () => {
    // Create test user
    const [reader] = await db.insert(usersTable)
      .values([{
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      }])
      .returning()
      .execute();

    // Create offline reader profile
    await db.insert(readerProfilesTable)
      .values([{
        user_id: reader.id,
        display_name: 'Offline Reader',
        specialties: ['tarot'],
        years_experience: 5,
        rating: '4.5',
        total_reviews: 50,
        is_online: false,
        is_available: false,
        chat_rate_per_minute: '2.50',
        phone_rate_per_minute: '3.00',
        video_rate_per_minute: '4.00'
      }])
      .execute();

    const results = await getOnlineReaders();

    expect(results).toHaveLength(0);
  });

  it('should include all required reader profile fields', async () => {
    // Create test user
    const [reader] = await db.insert(usersTable)
      .values([{
        email: 'reader@test.com',
        name: 'Test Reader',
        role: 'reader'
      }])
      .returning()
      .execute();

    // Create reader profile
    await db.insert(readerProfilesTable)
      .values([{
        user_id: reader.id,
        display_name: 'Complete Reader',
        bio: 'Experienced reader with many specialties',
        specialties: ['tarot', 'psychic', 'love', 'career'],
        years_experience: 12,
        rating: '4.8',
        total_reviews: 95,
        is_online: true,
        is_available: true,
        chat_rate_per_minute: '2.75',
        phone_rate_per_minute: '3.25',
        video_rate_per_minute: '4.25'
      }])
      .execute();

    const results = await getOnlineReaders();

    expect(results).toHaveLength(1);
    const profile = results[0];

    // Verify all required fields are present
    expect(profile.id).toBeDefined();
    expect(profile.user_id).toEqual(reader.id);
    expect(profile.display_name).toEqual('Complete Reader');
    expect(profile.bio).toEqual('Experienced reader with many specialties');
    expect(profile.specialties).toEqual(['tarot', 'psychic', 'love', 'career']);
    expect(profile.years_experience).toEqual(12);
    expect(profile.rating).toEqual(4.8);
    expect(profile.total_reviews).toEqual(95);
    expect(profile.is_online).toBe(true);
    expect(profile.is_available).toBe(true);
    expect(profile.chat_rate_per_minute).toEqual(2.75);
    expect(profile.phone_rate_per_minute).toEqual(3.25);
    expect(profile.video_rate_per_minute).toEqual(4.25);
    expect(profile.total_earnings).toEqual(0);
    expect(profile.pending_payout).toEqual(0);
    expect(profile.created_at).toBeInstanceOf(Date);
    expect(profile.updated_at).toBeInstanceOf(Date);
  });
});
