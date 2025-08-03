
import { db } from '../db';
import { sessionRatingsTable, readingSessionsTable, readerProfilesTable } from '../db/schema';
import { type CreateSessionRatingInput, type SessionRating } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createSessionRating = async (input: CreateSessionRatingInput): Promise<SessionRating> => {
  try {
    // First, get the session details and validate it exists and is completed
    const sessions = await db.select()
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.id, input.session_id))
      .execute();

    if (sessions.length === 0) {
      throw new Error('Session not found');
    }

    const session = sessions[0];
    
    if (session.status !== 'completed') {
      throw new Error('Session must be completed to rate');
    }

    // Check if rating already exists for this session
    const existingRatings = await db.select()
      .from(sessionRatingsTable)
      .where(eq(sessionRatingsTable.session_id, input.session_id))
      .execute();

    if (existingRatings.length > 0) {
      throw new Error('Session has already been rated');
    }

    // Insert the rating
    const result = await db.insert(sessionRatingsTable)
      .values({
        session_id: input.session_id,
        client_id: session.client_id,
        reader_id: session.reader_id,
        rating: input.rating,
        review: input.review
      })
      .returning()
      .execute();

    const newRating = result[0];

    // Update reader's rating and review count
    // Get current reader profile
    const readerProfiles = await db.select()
      .from(readerProfilesTable)
      .where(eq(readerProfilesTable.user_id, session.reader_id))
      .execute();

    if (readerProfiles.length > 0) {
      const readerProfile = readerProfiles[0];
      const currentRating = parseFloat(readerProfile.rating);
      const currentTotalReviews = readerProfile.total_reviews;
      
      // Calculate new average rating
      const newTotalReviews = currentTotalReviews + 1;
      const newAverageRating = ((currentRating * currentTotalReviews) + input.rating) / newTotalReviews;
      
      // Update reader profile
      await db.update(readerProfilesTable)
        .set({
          rating: newAverageRating.toString(),
          total_reviews: newTotalReviews,
          updated_at: new Date()
        })
        .where(eq(readerProfilesTable.user_id, session.reader_id))
        .execute();
    }

    return {
      ...newRating,
      created_at: newRating.created_at
    };
  } catch (error) {
    console.error('Session rating creation failed:', error);
    throw error;
  }
};
