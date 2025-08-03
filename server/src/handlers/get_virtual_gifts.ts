
import { db } from '../db';
import { virtualGiftsTable } from '../db/schema';
import { type VirtualGift } from '../schema';

export const getVirtualGifts = async (): Promise<VirtualGift[]> => {
  try {
    const results = await db.select()
      .from(virtualGiftsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(gift => ({
      ...gift,
      price: parseFloat(gift.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch virtual gifts:', error);
    throw error;
  }
};
