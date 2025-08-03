
import { db } from '../db';
import { readingSessionsTable, clientAccountsTable, readerProfilesTable, transactionsTable } from '../db/schema';
import { type UpdateSessionStatusInput, type ReadingSession } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSessionStatus = async (input: UpdateSessionStatusInput): Promise<ReadingSession> => {
  try {
    // First, get the current session data to validate and get rates
    const sessions = await db.select()
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.id, input.session_id))
      .execute();

    if (sessions.length === 0) {
      throw new Error(`Session with id ${input.session_id} not found`);
    }

    const session = sessions[0];

    // Calculate total cost if session is being completed and duration is provided
    let totalCost = input.total_cost;
    if (input.status === 'completed' && input.duration_minutes && !totalCost) {
      totalCost = parseFloat(session.rate_per_minute) * input.duration_minutes;
    }

    // Update the session
    const updatedSessions = await db.update(readingSessionsTable)
      .set({
        status: input.status,
        duration_minutes: input.duration_minutes?.toString(),
        total_cost: totalCost?.toString(),
        ended_at: input.status === 'completed' ? new Date() : session.ended_at
      })
      .where(eq(readingSessionsTable.id, input.session_id))
      .returning()
      .execute();

    const updatedSession = updatedSessions[0];

    // If session is completed with a cost, handle financial transactions
    if (input.status === 'completed' && totalCost && totalCost > 0) {
      // Get current client account values and update
      const clientAccounts = await db.select()
        .from(clientAccountsTable)
        .where(eq(clientAccountsTable.user_id, session.client_id))
        .execute();

      if (clientAccounts.length > 0) {
        const currentBalance = parseFloat(clientAccounts[0].balance);
        const currentSpent = parseFloat(clientAccounts[0].total_spent);

        await db.update(clientAccountsTable)
          .set({
            balance: (currentBalance - totalCost).toString(),
            total_spent: (currentSpent + totalCost).toString()
          })
          .where(eq(clientAccountsTable.user_id, session.client_id))
          .execute();
      }

      // Get current reader profile values and update earnings
      const readerProfiles = await db.select()
        .from(readerProfilesTable)
        .where(eq(readerProfilesTable.user_id, session.reader_id))
        .execute();

      if (readerProfiles.length > 0) {
        const currentEarnings = parseFloat(readerProfiles[0].total_earnings);
        const currentPending = parseFloat(readerProfiles[0].pending_payout);

        await db.update(readerProfilesTable)
          .set({
            total_earnings: (currentEarnings + totalCost).toString(),
            pending_payout: (currentPending + totalCost).toString()
          })
          .where(eq(readerProfilesTable.user_id, session.reader_id))
          .execute();
      }

      // Create transaction record for the payment
      await db.insert(transactionsTable)
        .values({
          user_id: session.client_id,
          type: 'reading_payment',
          status: 'completed',
          amount: totalCost.toString(),
          description: `Payment for ${session.session_type} reading session`
        })
        .execute();
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...updatedSession,
      rate_per_minute: parseFloat(updatedSession.rate_per_minute),
      duration_minutes: updatedSession.duration_minutes ? parseFloat(updatedSession.duration_minutes) : null,
      total_cost: updatedSession.total_cost ? parseFloat(updatedSession.total_cost) : null
    };
  } catch (error) {
    console.error('Session status update failed:', error);
    throw error;
  }
};
