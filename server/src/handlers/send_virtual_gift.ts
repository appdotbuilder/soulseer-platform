
import { db } from '../db';
import { virtualGiftsTable, clientAccountsTable, readerProfilesTable, giftTransactionsTable, transactionsTable } from '../db/schema';
import { type SendVirtualGiftInput, type GiftTransaction } from '../schema';
import { eq } from 'drizzle-orm';

export const sendVirtualGift = async (input: SendVirtualGiftInput): Promise<GiftTransaction> => {
  try {
    // Validate gift exists
    const gifts = await db.select()
      .from(virtualGiftsTable)
      .where(eq(virtualGiftsTable.id, input.gift_id))
      .execute();

    if (gifts.length === 0) {
      throw new Error('Gift not found');
    }

    const gift = gifts[0];
    const giftPrice = parseFloat(gift.price);

    // Get sender's client account and validate balance
    const senderAccounts = await db.select()
      .from(clientAccountsTable)
      .where(eq(clientAccountsTable.user_id, input.sender_id))
      .execute();

    if (senderAccounts.length === 0) {
      throw new Error('Sender account not found');
    }

    const senderAccount = senderAccounts[0];
    const senderBalance = parseFloat(senderAccount.balance);

    if (senderBalance < giftPrice) {
      throw new Error('Insufficient balance');
    }

    // Get receiver's reader profile
    const receiverProfiles = await db.select()
      .from(readerProfilesTable)
      .where(eq(readerProfilesTable.user_id, input.receiver_id))
      .execute();

    if (receiverProfiles.length === 0) {
      throw new Error('Receiver profile not found');
    }

    const receiverProfile = receiverProfiles[0];

    // Calculate receiver earnings (70% split)
    const receiverEarnings = giftPrice * 0.7;

    // Create gift transaction
    const giftTransactionResult = await db.insert(giftTransactionsTable)
      .values({
        gift_id: input.gift_id,
        sender_id: input.sender_id,
        receiver_id: input.receiver_id,
        stream_id: input.stream_id,
        amount: giftPrice.toString()
      })
      .returning()
      .execute();

    const giftTransaction = giftTransactionResult[0];

    // Update sender balance and total spent
    const newSenderBalance = senderBalance - giftPrice;
    const newSenderTotalSpent = parseFloat(senderAccount.total_spent) + giftPrice;

    await db.update(clientAccountsTable)
      .set({
        balance: newSenderBalance.toString(),
        total_spent: newSenderTotalSpent.toString(),
        updated_at: new Date()
      })
      .where(eq(clientAccountsTable.user_id, input.sender_id))
      .execute();

    // Update receiver earnings and pending payout
    const newReceiverTotalEarnings = parseFloat(receiverProfile.total_earnings) + receiverEarnings;
    const newReceiverPendingPayout = parseFloat(receiverProfile.pending_payout) + receiverEarnings;

    await db.update(readerProfilesTable)
      .set({
        total_earnings: newReceiverTotalEarnings.toString(),
        pending_payout: newReceiverPendingPayout.toString(),
        updated_at: new Date()
      })
      .where(eq(readerProfilesTable.user_id, input.receiver_id))
      .execute();

    // Create transaction record for gift purchase
    await db.insert(transactionsTable)
      .values({
        user_id: input.sender_id,
        type: 'gift_purchase',
        status: 'completed',
        amount: giftPrice.toString(),
        description: `Gift purchase: ${gift.name}`
      })
      .execute();

    // Return gift transaction with numeric conversion
    return {
      ...giftTransaction,
      amount: parseFloat(giftTransaction.amount)
    };
  } catch (error) {
    console.error('Virtual gift sending failed:', error);
    throw error;
  }
};
