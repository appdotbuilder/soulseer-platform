
import { db } from '../db';
import { usersTable, clientAccountsTable, readingSessionsTable, readerProfilesTable } from '../db/schema';
import { type User, type ClientAccount, type ReadingSession } from '../schema';
import { eq, desc, and, inArray, count, sql } from 'drizzle-orm';

export interface ClientDashboardData {
  user: User;
  account: ClientAccount;
  recentSessions: ReadingSession[];
  favoriteReaders: User[];
}

export const getClientDashboard = async (userId: string): Promise<ClientDashboardData> => {
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

    // Fetch client account data
    const accounts = await db.select()
      .from(clientAccountsTable)
      .where(eq(clientAccountsTable.user_id, userId))
      .execute();

    if (accounts.length === 0) {
      throw new Error('Client account not found');
    }

    const account = {
      ...accounts[0],
      balance: parseFloat(accounts[0].balance),
      total_spent: parseFloat(accounts[0].total_spent)
    };

    // Fetch recent sessions (last 10)
    const sessionResults = await db.select()
      .from(readingSessionsTable)
      .where(eq(readingSessionsTable.client_id, userId))
      .orderBy(desc(readingSessionsTable.created_at))
      .limit(10)
      .execute();

    const recentSessions = sessionResults.map(session => ({
      ...session,
      rate_per_minute: parseFloat(session.rate_per_minute),
      duration_minutes: session.duration_minutes ? parseFloat(session.duration_minutes) : null,
      total_cost: session.total_cost ? parseFloat(session.total_cost) : null
    }));

    // Get favorite readers (readers with most sessions by this client)
    const favoriteReaderResults = await db.select({
      reader_id: readingSessionsTable.reader_id,
      session_count: count(readingSessionsTable.id).as('session_count')
    })
      .from(readingSessionsTable)
      .where(
        and(
          eq(readingSessionsTable.client_id, userId),
          eq(readingSessionsTable.status, 'completed')
        )
      )
      .groupBy(readingSessionsTable.reader_id)
      .orderBy(desc(sql`session_count`))
      .limit(5)
      .execute();

    // Fetch user details for favorite readers
    let favoriteReaders: User[] = [];
    if (favoriteReaderResults.length > 0) {
      const readerIds = favoriteReaderResults.map(r => r.reader_id);
      const readerUsers = await db.select()
        .from(usersTable)
        .where(inArray(usersTable.id, readerIds))
        .execute();
      favoriteReaders = readerUsers;
    }

    return {
      user,
      account,
      recentSessions,
      favoriteReaders
    };
  } catch (error) {
    console.error('Client dashboard fetch failed:', error);
    throw error;
  }
};
