
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProducts = async (): Promise<Product[]> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.status, 'active'))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price)
    }));
  } catch (error) {
    console.error('Get products failed:', error);
    throw error;
  }
};
