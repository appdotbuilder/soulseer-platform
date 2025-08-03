
import { db } from '../db';
import { usersTable, readerProfilesTable, readingSessionsTable, transactionsTable } from '../db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { type User, type ReaderProfile, type ReadingSession, type Transaction } from '../schema';

export interface ReaderDashboardData {
  user: User;
  profile: ReaderProfile;
  recentSessions: ReadingSession[];
  earnings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
  };
  recentTransactions: Transaction[];
}

export const getReaderDashboard = async (userId: string): Promise<ReaderDashboardData> => {
  try {
    // Fetch user data
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // Fetch reader profile
    const profiles = await db.select()
      .from(readerProfilesTable)
      .where(eq(readerProfilesTable.user_id, userId))
      .execute();

    if (profiles.length === 0) {
      throw new Error('Reader profile not found');
    }

    const profile = profiles[0];

    // Fetch recent sessions (last 10)
    const sessionsResults = await db.select()
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.reader_id, userId))
      .orderBy(desc(readingSessionsTable.created_at))
      .limit(10)
      .execute();

    // Fetch recent transactions (last 10)
    const transactionResults = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.user_id, userId))
      .orderBy(desc(transactionsTable.created_at))
      .limit(10)
      .execute();

    // Calculate date boundaries for earnings
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const monthStart = new Date(today);
    monthStart.setDate(today.getDate() - 30);

    // Fetch completed sessions for earnings calculation
    const completedSessions = await db.select()
      .from(readingSessionsTable)
      .where(and(
        eq(readingSessionsTable.reader_id, userId),
        eq(readingSessionsTable.status, 'completed')
      ))
      .execute();

    // Calculate earnings
    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;

    completedSessions.forEach(session => {
      const totalCost = session.total_cost ? parseFloat(session.total_cost) : 0;
      const sessionDate = session.ended_at || session.started_at;

      if (sessionDate >= today) {
        todayEarnings += totalCost;
      }
      if (sessionDate >= weekStart) {
        weekEarnings += totalCost;
      }
      if (sessionDate >= monthStart) {
        monthEarnings += totalCost;
      }
    });

    // Convert numeric fields for profile
    const convertedProfile: ReaderProfile = {
      ...profile,
      rating: parseFloat(profile.rating),
      chat_rate_per_minute: parseFloat(profile.chat_rate_per_minute),
      phone_rate_per_minute: parseFloat(profile.phone_rate_per_minute),
      video_rate_per_minute: parseFloat(profile.video_rate_per_minute),
      total_earnings: parseFloat(profile.total_earnings),
      pending_payout: parseFloat(profile.pending_payout)
    };

    // Convert sessions data
    const recentSessions: ReadingSession[] = sessionsResults.map(session => ({
      ...session,
      rate_per_minute: parseFloat(session.rate_per_minute),
      duration_minutes: session.duration_minutes ? parseFloat(session.duration_minutes) : null,
      total_cost: session.total_cost ? parseFloat(session.total_cost) : null
    }));

    // Convert transactions data
    const recentTransactions: Transaction[] = transactionResults.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount)
    }));

    return {
      user,
      profile: convertedProfile,
      recentSessions,
      earnings: {
        today: todayEarnings,
        thisWeek: weekEarnings,
        thisMonth: monthEarnings,
        pending: convertedProfile.pending_payout
      },
      recentTransactions
    };
  } catch (error) {
    console.error('Reader dashboard fetch failed:', error);
    throw error;
  }
};
