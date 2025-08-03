
import { db } from '../db';
import { readerProfilesTable } from '../db/schema';
import { type UpdateReaderAvailabilityInput, type ReaderProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const updateReaderAvailability = async (input: UpdateReaderAvailabilityInput): Promise<ReaderProfile> => {
  try {
    // Update reader profile with new availability status
    const result = await db.update(readerProfilesTable)
      .set({
        is_online: input.is_online,
        is_available: input.is_available,
        updated_at: new Date()
      })
      .where(eq(readerProfilesTable.id, input.reader_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Reader profile not found');
    }

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
    console.error('Reader availability update failed:', error);
    throw error;
  }
};
