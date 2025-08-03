
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, clientAccountsTable, readerProfilesTable, virtualGiftsTable, giftTransactionsTable, transactionsTable } from '../db/schema';
import { type SendVirtualGiftInput } from '../schema';
import { sendVirtualGift } from '../handlers/send_virtual_gift';
import { eq } from 'drizzle-orm';

describe('sendVirtualGift', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should send a virtual gift successfully', async () => {
    // Create test users
    const senderResult = await db.insert(usersTable)
      .values({
        email: 'sender@test.com',
        name: 'Sender User',
        role: 'client'
      })
      .returning()
      .execute();
    const sender = senderResult[0];

    const receiverResult = await db.insert(usersTable)
      .values({
        email: 'receiver@test.com',
        name: 'Receiver User',
        role: 'reader'
      })
      .returning()
      .execute();
    const receiver = receiverResult[0];

    // Create sender client account with balance
    await db.insert(clientAccountsTable)
      .values({
        user_id: sender.id,
        balance: '100.00'
      })
      .execute();

    // Create receiver reader profile
    await db.insert(readerProfilesTable)
      .values({
        user_id: receiver.id,
        display_name: 'Test Reader',
        specialties: ['tarot'],
        years_experience: 5,
        chat_rate_per_minute: '2.50',
        phone_rate_per_minute: '3.50',
        video_rate_per_minute: '4.50'
      })
      .execute();

    // Create virtual gift
    const giftResult = await db.insert(virtualGiftsTable)
      .values({
        name: 'Crystal Ball',
        image_url: 'http://example.com/crystal.png',
        price: '10.00'
      })
      .returning()
      .execute();
    const gift = giftResult[0];

    const input: SendVirtualGiftInput = {
      gift_id: gift.id,
      sender_id: sender.id,
      receiver_id: receiver.id,
      stream_id: null
    };

    const result = await sendVirtualGift(input);

    // Verify gift transaction
    expect(result.gift_id).toEqual(gift.id);
    expect(result.sender_id).toEqual(sender.id);
    expect(result.receiver_id).toEqual(receiver.id);
    expect(result.stream_id).toBeNull();
    expect(result.amount).toEqual(10.00);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update sender balance and total spent', async () => {
    // Create test users and accounts
    const senderResult = await db.insert(usersTable)
      .values({
        email: 'sender@test.com',
        name: 'Sender User',
        role: 'client'
      })
      .returning()
      .execute();
    const sender = senderResult[0];

    const receiverResult = await db.insert(usersTable)
      .values({
        email: 'receiver@test.com',
        name: 'Receiver User',
        role: 'reader'
      })
      .returning()
      .execute();
    const receiver = receiverResult[0];

    await db.insert(clientAccountsTable)
      .values({
        user_id: sender.id,
        balance: '50.00',
        total_spent: '25.00'
      })
      .execute();

    await db.insert(readerProfilesTable)
      .values({
        user_id: receiver.id,
        display_name: 'Test Reader',
        specialties: ['tarot'],
        years_experience: 5,
        chat_rate_per_minute: '2.50',
        phone_rate_per_minute: '3.50',
        video_rate_per_minute: '4.50'
      })
      .execute();

    const giftResult = await db.insert(virtualGiftsTable)
      .values({
        name: 'Rose',
        image_url: 'http://example.com/rose.png',
        price: '5.00'
      })
      .returning()
      .execute();
    const gift = giftResult[0];

    const input: SendVirtualGiftInput = {
      gift_id: gift.id,
      sender_id: sender.id,
      receiver_id: receiver.id,
      stream_id: null
    };

    await sendVirtualGift(input);

    // Check sender account updates
    const updatedSenderAccounts = await db.select()
      .from(clientAccountsTable)
      .where(eq(clientAccountsTable.user_id, sender.id))
      .execute();

    const updatedSenderAccount = updatedSenderAccounts[0];
    expect(parseFloat(updatedSenderAccount.balance)).toEqual(45.00);
    expect(parseFloat(updatedSenderAccount.total_spent)).toEqual(30.00);
  });

  it('should update receiver earnings with 70% split', async () => {
    // Create test users and accounts
    const senderResult = await db.insert(usersTable)
      .values({
        email: 'sender@test.com',
        name: 'Sender User',
        role: 'client'
      })
      .returning()
      .execute();
    const sender = senderResult[0];

    const receiverResult = await db.insert(usersTable)
      .values({
        email: 'receiver@test.com',
        name: 'Receiver User',
        role: 'reader'
      })
      .returning()
      .execute();
    const receiver = receiverResult[0];

    await db.insert(clientAccountsTable)
      .values({
        user_id: sender.id,
        balance: '100.00'
      })
      .execute();

    await db.insert(readerProfilesTable)
      .values({
        user_id: receiver.id,
        display_name: 'Test Reader',
        specialties: ['tarot'],
        years_experience: 5,
        total_earnings: '50.00',
        pending_payout: '20.00',
        chat_rate_per_minute: '2.50',
        phone_rate_per_minute: '3.50',
        video_rate_per_minute: '4.50'
      })
      .execute();

    const giftResult = await db.insert(virtualGiftsTable)
      .values({
        name: 'Diamond',
        image_url: 'http://example.com/diamond.png',
        price: '20.00'
      })
      .returning()
      .execute();
    const gift = giftResult[0];

    const input: SendVirtualGiftInput = {
      gift_id: gift.id,
      sender_id: sender.id,
      receiver_id: receiver.id,
      stream_id: null
    };

    await sendVirtualGift(input);

    // Check receiver profile updates (70% of 20.00 = 14.00)
    const updatedReceiverProfiles = await db.select()
      .from(readerProfilesTable)
      .where(eq(readerProfilesTable.user_id, receiver.id))
      .execute();

    const updatedReceiverProfile = updatedReceiverProfiles[0];
    expect(parseFloat(updatedReceiverProfile.total_earnings)).toEqual(64.00);
    expect(parseFloat(updatedReceiverProfile.pending_payout)).toEqual(34.00);
  });

  it('should create transaction record for gift purchase', async () => {
    // Create test users and accounts
    const senderResult = await db.insert(usersTable)
      .values({
        email: 'sender@test.com',
        name: 'Sender User',
        role: 'client'
      })
      .returning()
      .execute();
    const sender = senderResult[0];

    const receiverResult = await db.insert(usersTable)
      .values({
        email: 'receiver@test.com',
        name: 'Receiver User',
        role: 'reader'
      })
      .returning()
      .execute();
    const receiver = receiverResult[0];

    await db.insert(clientAccountsTable)
      .values({
        user_id: sender.id,
        balance: '100.00'
      })
      .execute();

    await db.insert(readerProfilesTable)
      .values({
        user_id: receiver.id,
        display_name: 'Test Reader',
        specialties: ['tarot'],
        years_experience: 5,
        chat_rate_per_minute: '2.50',
        phone_rate_per_minute: '3.50',
        video_rate_per_minute: '4.50'
      })
      .execute();

    const giftResult = await db.insert(virtualGiftsTable)
      .values({
        name: 'Butterfly',
        image_url: 'http://example.com/butterfly.png',
        price: '15.00'
      })
      .returning()
      .execute();
    const gift = giftResult[0];

    const input: SendVirtualGiftInput = {
      gift_id: gift.id,
      sender_id: sender.id,
      receiver_id: receiver.id,
      stream_id: null
    };

    await sendVirtualGift(input);

    // Check transaction record created
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.user_id, sender.id))
      .execute();

    expect(transactions).toHaveLength(1);
    const transaction = transactions[0];
    expect(transaction.type).toEqual('gift_purchase');
    expect(transaction.status).toEqual('completed');
    expect(parseFloat(transaction.amount)).toEqual(15.00);
    expect(transaction.description).toEqual('Gift purchase: Butterfly');
  });

  it('should throw error when gift not found', async () => {
    const input: SendVirtualGiftInput = {
      gift_id: '00000000-0000-0000-0000-000000000000',
      sender_id: '00000000-0000-0000-0000-000000000001',
      receiver_id: '00000000-0000-0000-0000-000000000002',
      stream_id: null
    };

    expect(sendVirtualGift(input)).rejects.toThrow(/Gift not found/i);
  });

  it('should throw error when sender has insufficient balance', async () => {
    // Create test users
    const senderResult = await db.insert(usersTable)
      .values({
        email: 'sender@test.com',
        name: 'Sender User',
        role: 'client'
      })
      .returning()
      .execute();
    const sender = senderResult[0];

    const receiverResult = await db.insert(usersTable)
      .values({
        email: 'receiver@test.com',
        name: 'Receiver User',
        role: 'reader'
      })
      .returning()
      .execute();
    const receiver = receiverResult[0];

    // Create sender account with insufficient balance
    await db.insert(clientAccountsTable)
      .values({
        user_id: sender.id,
        balance: '5.00'
      })
      .execute();

    await db.insert(readerProfilesTable)
      .values({
        user_id: receiver.id,
        display_name: 'Test Reader',
        specialties: ['tarot'],
        years_experience: 5,
        chat_rate_per_minute: '2.50',
        phone_rate_per_minute: '3.50',
        video_rate_per_minute: '4.50'
      })
      .execute();

    const giftResult = await db.insert(virtualGiftsTable)
      .values({
        name: 'Expensive Gift',
        image_url: 'http://example.com/expensive.png',
        price: '50.00'
      })
      .returning()
      .execute();
    const gift = giftResult[0];

    const input: SendVirtualGiftInput = {
      gift_id: gift.id,
      sender_id: sender.id,
      receiver_id: receiver.id,
      stream_id: null
    };

    expect(sendVirtualGift(input)).rejects.toThrow(/Insufficient balance/i);
  });

  it('should throw error when receiver profile not found', async () => {
    // Create sender only
    const senderResult = await db.insert(usersTable)
      .values({
        email: 'sender@test.com',
        name: 'Sender User',
        role: 'client'
      })
      .returning()
      .execute();
    const sender = senderResult[0];

    await db.insert(clientAccountsTable)
      .values({
        user_id: sender.id,
        balance: '100.00'
      })
      .execute();

    const giftResult = await db.insert(virtualGiftsTable)
      .values({
        name: 'Test Gift',
        image_url: 'http://example.com/gift.png',
        price: '10.00'
      })
      .returning()
      .execute();
    const gift = giftResult[0];

    const input: SendVirtualGiftInput = {
      gift_id: gift.id,
      sender_id: sender.id,
      receiver_id: '00000000-0000-0000-0000-000000000002',
      stream_id: null
    };

    expect(sendVirtualGift(input)).rejects.toThrow(/Receiver profile not found/i);
  });
});
