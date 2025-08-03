
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, usersTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        email: 'creator@example.com',
        name: 'Test Creator',
        role: 'admin'
      })
      .returning()
      .execute();
    return result[0];
  };

  const testInput: CreateProductInput = {
    name: 'Test Product',
    description: 'A product for testing',
    type: 'digital',
    price: 29.99,
    inventory_quantity: null, // Digital product - no inventory
    created_by: null, // Will be set in tests that need it
    image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
  };

  it('should create a digital product', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual(testInput.description);
    expect(result.type).toEqual('digital');
    expect(result.status).toEqual('active');
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toBe('number');
    expect(result.inventory_quantity).toBeNull();
    expect(result.stripe_product_id).toBeNull();
    expect(result.created_by).toBeNull();
    expect(result.image_urls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a physical product with inventory', async () => {
    const physicalInput = {
      ...testInput,
      type: 'physical' as const,
      price: 49.99,
      inventory_quantity: 100
    };

    const result = await createProduct(physicalInput);

    expect(result.type).toEqual('physical');
    expect(result.price).toEqual(49.99);
    expect(typeof result.price).toBe('number');
    expect(result.inventory_quantity).toEqual(100);
  });

  it('should create a service product', async () => {
    const serviceInput = {
      ...testInput,
      type: 'service' as const,
      price: 199.99,
      inventory_quantity: null
    };

    const result = await createProduct(serviceInput);

    expect(result.type).toEqual('service');
    expect(result.price).toEqual(199.99);
    expect(typeof result.price).toBe('number');
    expect(result.inventory_quantity).toBeNull();
  });

  it('should create product with creator', async () => {
    const creator = await createTestUser();
    const inputWithCreator = {
      ...testInput,
      created_by: creator.id
    };

    const result = await createProduct(inputWithCreator);

    expect(result.created_by).toEqual(creator.id);
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.name).toEqual('Test Product');
    expect(savedProduct.description).toEqual(testInput.description);
    expect(savedProduct.type).toEqual('digital');
    expect(savedProduct.status).toEqual('active');
    expect(parseFloat(savedProduct.price)).toEqual(29.99);
    expect(savedProduct.inventory_quantity).toBeNull();
    expect(savedProduct.created_at).toBeInstanceOf(Date);
    expect(savedProduct.updated_at).toBeInstanceOf(Date);
    expect(savedProduct.image_urls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
  });

  it('should handle empty image_urls array', async () => {
    const inputWithNoImages = {
      ...testInput,
      image_urls: []
    };

    const result = await createProduct(inputWithNoImages);

    expect(result.image_urls).toEqual([]);
  });

  it('should handle decimal prices correctly', async () => {
    const inputWithDecimalPrice = {
      ...testInput,
      price: 19.95
    };

    const result = await createProduct(inputWithDecimalPrice);

    expect(result.price).toEqual(19.95);
    expect(typeof result.price).toBe('number');

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(parseFloat(products[0].price)).toEqual(19.95);
  });
});
