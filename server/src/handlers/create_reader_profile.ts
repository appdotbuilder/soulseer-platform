
import { db } from '../db';
import { usersTable, readerProfilesTable } from '../db/schema';
import { type CreateReaderProfileInput, type ReaderProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const createReaderProfile = async (input: CreateReaderProfileInput): Promise<ReaderProfile> => {
  try {
    // Verify user exists and has reader role
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    const user = users[0];
    if (user.role !== 'reader') {
      throw new Error(`User must have reader role to create reader profile`);
    }

    // Check if reader profile already exists
    const existingProfiles = await db.select()
      .from(readerProfilesTable)
      .where(eq(readerProfilesTable.user_id, input.user_id))
      .execute();

    if (existingProfiles.length > 0) {
      throw new Error(`Reader profile already exists for user ${input.user_id}`);
    }

    // Create reader profile
    const result = await db.insert(readerProfilesTable)
      .values({
        user_id: input.user_id,
        display_name: input.display_name,
        bio: input.bio,
        specialties: input.specialties,
        years_experience: input.years_experience,
        chat_rate_per_minute: input.chat_rate_per_minute.toString(),
        phone_rate_per_minute: input.phone_rate_per_minute.toString(),
        video_rate_per_minute: input.video_rate_per_minute.toString()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const profile = result[0];
    return {
      ...profile,
      rating: parseFloat(profile.rating),
      chat_rate_per_minute: parseFloat(profile.chat_rate_per_minute),
      phone_rate_per_minute: parseFloat(profile.phone_rate_per_minute),
      video_rate_per_minute: parseFloat(profile.video_rate_per_minute),
      total_earnings: parseFloat(profile.total_earnings),
      pending_payout: parseFloat(profile.pending_payout)
    };
  } catch (error) {
    console.error('Reader profile creation failed:', error);
    throw error;
  }
};
