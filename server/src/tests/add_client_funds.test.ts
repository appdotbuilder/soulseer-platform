
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, clientAccountsTable, transactionsTable } from '../db/schema';
import { type AddFundsInput } from '../schema';
import { addClientFunds } from '../handlers/add_client_funds';
import { eq } from 'drizzle-orm';

describe('addClientFunds', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestUser = async () => {
    const userResult = await db.insert(usersTable)
      .values({
        email: 'client@example.com',
        name: 'Test Client',
        role: 'client'
      })
      .returning()
      .execute();
    return userResult[0];
  };

  const testInput: AddFundsInput = {
    user_id: '', // Will be set in tests
    amount: 100.50,
    payment_method_id: 'pm_test_123456'
  };

  it('should add funds to client account', async () => {
    const user = await createTestUser();
    const input = { ...testInput, user_id: user.id };

    const result = await addClientFunds(input);

    // Verify transaction properties
    expect(result.user_id).toEqual(user.id);
    expect(result.type).toEqual('deposit');
    expect(result.status).toEqual('completed');
    expect(result.amount).toEqual(100.50);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Deposit of $100.5');
    expect(result.stripe_payment_intent_id).toMatch(/^pi_/);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create client account if it does not exist', async () => {
    const user = await createTestUser();
    const input = { ...testInput, user_id: user.id };

    // Verify no client account exists initially
    const initialAccounts = await db.select()
      .from(clientAccountsTable)
      .where(eq(clientAccountsTable.user_id, user.id))
      .execute();
    expect(initialAccounts).toHaveLength(0);

    await addClientFunds(input);

    // Verify client account was created
    const accounts = await db.select()
      .from(clientAccountsTable)
      .where(eq(clientAccountsTable.user_id, user.id))
      .execute();
    expect(accounts).toHaveLength(1);
    expect(parseFloat(accounts[0].balance)).toEqual(100.50);
    expect(parseFloat(accounts[0].total_spent)).toEqual(0);
  });

  it('should update existing client account balance', async () => {
    const user = await createTestUser();
    
    // Create existing client account with initial balance
    await db.insert(clientAccountsTable)
      .values({
        user_id: user.id,
        balance: '50.25',
        total_spent: '200.00'
      })
      .execute();

    const input = { ...testInput, user_id: user.id };
    await addClientFunds(input);

    // Verify balance was updated correctly
    const accounts = await db.select()
      .from(clientAccountsTable)
      .where(eq(clientAccountsTable.user_id, user.id))
      .execute();
    expect(accounts).toHaveLength(1);
    expect(parseFloat(accounts[0].balance)).toEqual(150.75); // 50.25 + 100.50
    expect(parseFloat(accounts[0].total_spent)).toEqual(200.00); // Should remain unchanged
  });

  it('should save transaction to database', async () => {
    const user = await createTestUser();
    const input = { ...testInput, user_id: user.id };

    const result = await addClientFunds(input);

    // Query transaction from database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    const transaction = transactions[0];
    expect(transaction.user_id).toEqual(user.id);
    expect(transaction.type).toEqual('deposit');
    expect(transaction.status).toEqual('completed');
    expect(parseFloat(transaction.amount)).toEqual(100.50);
    expect(transaction.description).toEqual('Deposit of $100.5');
    expect(transaction.stripe_payment_intent_id).toMatch(/^pi_/);
    expect(transaction.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const input = { 
      ...testInput, 
      user_id: '00000000-0000-0000-0000-000000000000' 
    };

    expect(addClientFunds(input)).rejects.toThrow(/user not found/i);
  });

  it('should handle multiple deposits correctly', async () => {
    const user = await createTestUser();
    const input1 = { ...testInput, user_id: user.id, amount: 25.00 };
    const input2 = { ...testInput, user_id: user.id, amount: 75.50 };

    await addClientFunds(input1);
    await addClientFunds(input2);

    // Verify final balance
    const accounts = await db.select()
      .from(clientAccountsTable)
      .where(eq(clientAccountsTable.user_id, user.id))
      .execute();
    expect(parseFloat(accounts[0].balance)).toEqual(100.50); // 25.00 + 75.50

    // Verify both transactions exist
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.user_id, user.id))
      .execute();
    expect(transactions).toHaveLength(2);
    expect(transactions.every(t => t.type === 'deposit')).toBe(true);
    expect(transactions.every(t => t.status === 'completed')).toBe(true);
  });
});
