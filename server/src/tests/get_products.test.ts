
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, usersTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    expect(result).toEqual([]);
  });

  it('should return only active products', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create active product
    await db.insert(productsTable)
      .values({
        name: 'Active Product',
        description: 'An active test product',
        type: 'digital',
        status: 'active',
        price: '29.99',
        inventory_quantity: 10,
        created_by: userResult[0].id,
        image_urls: ['https://example.com/image1.jpg']
      })
      .execute();

    // Create inactive product
    await db.insert(productsTable)
      .values({
        name: 'Inactive Product',
        description: 'An inactive test product',
        type: 'digital',
        status: 'inactive',
        price: '19.99',
        inventory_quantity: 5,
        created_by: userResult[0].id,
        image_urls: ['https://example.com/image2.jpg']
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Active Product');
    expect(result[0].status).toEqual('active');
    expect(result[0].price).toEqual(29.99);
    expect(typeof result[0].price).toEqual('number');
  });

  it('should convert price to number correctly', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    await db.insert(productsTable)
      .values({
        name: 'Price Test Product',
        description: 'Testing price conversion',
        type: 'physical',
        status: 'active',
        price: '123.45',
        inventory_quantity: 1,
        created_by: userResult[0].id,
        image_urls: ['https://example.com/image.jpg']
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].price).toEqual(123.45);
    expect(typeof result[0].price).toEqual('number');
  });

  it('should return all product fields correctly', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    await db.insert(productsTable)
      .values({
        name: 'Complete Product',
        description: 'A product with all fields',
        type: 'service',
        status: 'active',
        price: '99.99',
        inventory_quantity: 25,
        stripe_product_id: 'prod_test123',
        created_by: userResult[0].id,
        image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    const product = result[0];
    
    expect(product.name).toEqual('Complete Product');
    expect(product.description).toEqual('A product with all fields');
    expect(product.type).toEqual('service');
    expect(product.status).toEqual('active');
    expect(product.price).toEqual(99.99);
    expect(product.inventory_quantity).toEqual(25);
    expect(product.stripe_product_id).toEqual('prod_test123');
    expect(product.created_by).toEqual(userResult[0].id);
    expect(product.image_urls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(product.id).toBeDefined();
    expect(product.created_at).toBeInstanceOf(Date);
    expect(product.updated_at).toBeInstanceOf(Date);
  });
});
