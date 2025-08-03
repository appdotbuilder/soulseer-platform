
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { virtualGiftsTable } from '../db/schema';
import { getVirtualGifts } from '../handlers/get_virtual_gifts';

describe('getVirtualGifts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no gifts exist', async () => {
    const result = await getVirtualGifts();
    expect(result).toEqual([]);
  });

  it('should return all virtual gifts with correct data types', async () => {
    // Create test virtual gifts
    await db.insert(virtualGiftsTable)
      .values([
        {
          name: 'Rose',
          image_url: 'https://example.com/rose.png',
          price: '9.99',
          animation_url: 'https://example.com/rose-animation.gif'
        },
        {
          name: 'Heart',
          image_url: 'https://example.com/heart.png',
          price: '4.99',
          animation_url: null
        }
      ])
      .execute();

    const result = await getVirtualGifts();

    expect(result).toHaveLength(2);
    
    // Verify first gift
    const rose = result.find(gift => gift.name === 'Rose');
    expect(rose).toBeDefined();
    expect(rose!.name).toEqual('Rose');
    expect(rose!.image_url).toEqual('https://example.com/rose.png');
    expect(rose!.price).toEqual(9.99);
    expect(typeof rose!.price).toEqual('number');
    expect(rose!.animation_url).toEqual('https://example.com/rose-animation.gif');
    expect(rose!.id).toBeDefined();
    expect(rose!.created_at).toBeInstanceOf(Date);

    // Verify second gift
    const heart = result.find(gift => gift.name === 'Heart');
    expect(heart).toBeDefined();
    expect(heart!.name).toEqual('Heart');
    expect(heart!.image_url).toEqual('https://example.com/heart.png');
    expect(heart!.price).toEqual(4.99);
    expect(typeof heart!.price).toEqual('number');
    expect(heart!.animation_url).toBeNull();
    expect(heart!.id).toBeDefined();
    expect(heart!.created_at).toBeInstanceOf(Date);
  });

  it('should return gifts sorted by creation order', async () => {
    // Create gifts with slight time difference
    await db.insert(virtualGiftsTable)
      .values({
        name: 'First Gift',
        image_url: 'https://example.com/first.png',
        price: '1.00'
      })
      .execute();

    await db.insert(virtualGiftsTable)
      .values({
        name: 'Second Gift',
        image_url: 'https://example.com/second.png',
        price: '2.00'
      })
      .execute();

    const result = await getVirtualGifts();

    expect(result).toHaveLength(2);
    // Gifts should maintain insertion order
    expect(result[0].name).toEqual('First Gift');
    expect(result[1].name).toEqual('Second Gift');
  });
});
