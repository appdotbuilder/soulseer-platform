
import { db } from '../db';
import { readerProfilesTable, usersTable } from '../db/schema';
import { type ReaderProfile } from '../schema';
import { and, eq, desc } from 'drizzle-orm';

export const getOnlineReaders = async (): Promise<ReaderProfile[]> => {
  try {
    // Query reader profiles that are both online and available
    // Join with users table to get complete reader information
    // Order by rating (highest first) to show best readers first
    const results = await db
      .select({
        id: readerProfilesTable.id,
        user_id: readerProfilesTable.user_id,
        display_name: readerProfilesTable.display_name,
        bio: readerProfilesTable.bio,
        specialties: readerProfilesTable.specialties,
        years_experience: readerProfilesTable.years_experience,
        rating: readerProfilesTable.rating,
        total_reviews: readerProfilesTable.total_reviews,
        is_online: readerProfilesTable.is_online,
        is_available: readerProfilesTable.is_available,
        chat_rate_per_minute: readerProfilesTable.chat_rate_per_minute,
        phone_rate_per_minute: readerProfilesTable.phone_rate_per_minute,
        video_rate_per_minute: readerProfilesTable.video_rate_per_minute,
        total_earnings: readerProfilesTable.total_earnings,
        pending_payout: readerProfilesTable.pending_payout,
        created_at: readerProfilesTable.created_at,
        updated_at: readerProfilesTable.updated_at
      })
      .from(readerProfilesTable)
      .innerJoin(usersTable, eq(readerProfilesTable.user_id, usersTable.id))
      .where(
        and(
          eq(readerProfilesTable.is_online, true),
          eq(readerProfilesTable.is_available, true),
          eq(usersTable.role, 'reader')
        )
      )
      .orderBy(desc(readerProfilesTable.rating), desc(readerProfilesTable.total_reviews))
      .execute();

    // Convert numeric fields from strings to numbers
    return results.map(profile => ({
      ...profile,
      rating: parseFloat(profile.rating),
      chat_rate_per_minute: parseFloat(profile.chat_rate_per_minute),
      phone_rate_per_minute: parseFloat(profile.phone_rate_per_minute),
      video_rate_per_minute: parseFloat(profile.video_rate_per_minute),
      total_earnings: parseFloat(profile.total_earnings),
      pending_payout: parseFloat(profile.pending_payout)
    }));
  } catch (error) {
    console.error('Failed to fetch online readers:', error);
    throw error;
  }
};
