
import { db } from '../db';
import { clientAccountsTable, transactionsTable, usersTable } from '../db/schema';
import { type AddFundsInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const addClientFunds = async (input: AddFundsInput): Promise<Transaction> => {
  try {
    // Verify user exists and has client role or client account
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Check if client account exists, create if not
    let clientAccount = await db.select()
      .from(clientAccountsTable)
      .where(eq(clientAccountsTable.user_id, input.user_id))
      .execute();

    if (clientAccount.length === 0) {
      // Create client account if it doesn't exist
      await db.insert(clientAccountsTable)
        .values({
          user_id: input.user_id,
          balance: '0',
          total_spent: '0'
        })
        .execute();

      clientAccount = await db.select()
        .from(clientAccountsTable)
        .where(eq(clientAccountsTable.user_id, input.user_id))
        .execute();
    }

    // Create transaction record
    const transactionResult = await db.insert(transactionsTable)
      .values({
        user_id: input.user_id,
        type: 'deposit',
        status: 'completed', // In real implementation, this would be 'pending' until Stripe confirms
        amount: input.amount.toString(),
        description: `Deposit of $${input.amount}`,
        stripe_payment_intent_id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // Placeholder payment intent
      })
      .returning()
      .execute();

    // Update client account balance
    const currentBalance = parseFloat(clientAccount[0].balance);
    const newBalance = currentBalance + input.amount;

    await db.update(clientAccountsTable)
      .set({
        balance: newBalance.toString(),
        updated_at: new Date()
      })
      .where(eq(clientAccountsTable.user_id, input.user_id))
      .execute();

    // Return transaction with numeric conversion
    const transaction = transactionResult[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount)
    };
  } catch (error) {
    console.error('Add client funds failed:', error);
    throw error;
  }
};
