
import { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Package, Download, Zap } from 'lucide-react';
import type { Product } from '../../../server/src/schema';

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and then show demo data
    const timer = setTimeout(() => {
      setProducts([
        {
          id: '1',
          name: 'Celestial Tarot Deck - Premium Edition',
          description: 'A beautiful hand-illustrated tarot deck featuring celestial themes and gold foil accents. Perfect for both beginners and advanced readers.',
          type: 'physical' as const,
          status: 'active' as const,
          price: 49.99,
          inventory_quantity: 25,
          stripe_product_id: null,
          created_by: 'reader-1',
          image_urls: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'],
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: '2',
          name: 'Crystal Healing Guide - Digital Course',
          description: 'Complete digital course on crystal healing properties, cleansing rituals, and energy work. Includes video tutorials and PDF guides.',
          type: 'digital' as const,
          status: 'active' as const,
          price: 29.99,
          inventory_quantity: null,
          stripe_product_id: null,
          created_by: 'reader-2',
          image_urls: ['https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=400'],
          created_at: new Date('2024-01-12'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: '3',
          name: 'Personal Aura Reading Session',
          description: 'One-on-one aura reading session with detailed analysis and chakra balancing recommendations. Includes follow-up report.',
          type: 'service' as const,
          status: 'active' as const,
          price: 75.00,
          inventory_quantity: null,
          stripe_product_id: null,
          created_by: 'reader-3',
          image_urls: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'],
          created_at: new Date('2024-01-08'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: '4',
          name: 'Meditation Music Collection',
          description: 'Curated collection of high-frequency meditation music designed to enhance spiritual practice and deep relaxation.',
          type: 'digital' as const,
          status: 'active' as const,
          price: 19.99,
          inventory_quantity: null,
          stripe_product_id: null,
          created_by: 'reader-1',
          image_urls: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400'],
          created_at: new Date('2024-01-14'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: '5',
          name: 'Sacred Sage Cleansing Kit',
          description: 'Premium white sage bundle with abalone shell, feather, and detailed cleansing ritual instructions. Ethically sourced.',
          type: 'physical' as const,
          status: 'active' as const,
          price: 34.99,
          inventory_quantity: 18,
          stripe_product_id: null,
          created_by: 'reader-2',
          image_urls: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'],
          created_at: new Date('2024-01-11'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: '6',
          name: 'Past Life Regression Session',
          description: 'Guided past life regression session to explore your soul\'s journey and understand current life patterns and relationships.',
          type: 'service' as const,
          status: 'active' as const,
          price: 120.00,
          inventory_quantity: null,
          stripe_product_id: null,
          created_by: 'reader-3',
          image_urls: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
          created_at: new Date('2024-01-09'),
          updated_at: new Date('2024-01-15')
        }
      ] as Product[]);
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const getProductIcon = (type: Product['type']) => {
    switch (type) {
      case 'physical':
        return Package;
      case 'digital':
        return Download;
      case 'service':
        return Zap;
      default:
        return Package;
    }
  };

  const getProductTypeLabel = (type: Product['type']) => {
    switch (type) {
      case 'physical':
        return 'Physical Product';
      case 'digital':
        return 'Digital Download';
      case 'service':
        return 'Service';
      default:
        return 'Product';
    }
  };

  const getProductTypeColor = (type: Product['type']) => {
    switch (type) {
      case 'physical':
        return 'bg-green-600/20 text-green-400 border-green-400/30';
      case 'digital':
        return 'bg-blue-600/20 text-blue-400 border-blue-400/30';
      case 'service':
        return 'bg-purple-600/20 text-purple-400 border-purple-400/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-400/30';
    }
  };

  const handleAddToCart = (productId: string) => {
    // Demo implementation - show alert instead of actual cart functionality
    alert(`Demo: Adding product ${productId} to cart`);
  };

  if (isLoading) {
    return (
      <section className="py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-pink-400">
          Featured Products
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="mystical-card animate-pulse">
              <div className="aspect-square bg-gray-700 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-700 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-pink-400">Featured Products</h2>
        <Button 
          variant="outline" 
          className="border-pink-400/50 text-pink-400 hover:bg-pink-400/10"
          onClick={() => alert('Demo: View all products feature')}
        >
          View All Products
        </Button>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-2">No products available</p>
          <p className="text-gray-500">Check back soon for new spiritual products</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: Product) => {
            const ProductIcon = getProductIcon(product.type);
            
            return (
              <Card key={product.id} className="mystical-card overflow-hidden hover:scale-105 transition-transform duration-200">
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden">
                  {product.image_urls.length > 0 ? (
                    <img 
                      src={product.image_urls[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                      <ProductIcon className="w-16 h-16 text-white/60" />
                    </div>
                  )}
                  
                  {/* Product Type Badge */}
                  <Badge className={`absolute top-2 left-2 ${getProductTypeColor(product.type)}`}>
                    <ProductIcon className="w-3 h-3 mr-1" />
                    {getProductTypeLabel(product.type)}
                  </Badge>
                  
                  {/* Stock Badge for Physical Products */}
                  {product.type === 'physical' && product.inventory_quantity !== null && (
                    <Badge 
                      variant="secondary" 
                      className={`absolute top-2 right-2 ${
                        product.inventory_quantity > 10 
                          ? 'bg-green-600/20 text-green-400 border-green-400/30' 
                          : product.inventory_quantity > 0
                          ? 'bg-yellow-600/20 text-yellow-400 border-yellow-400/30'
                          : 'bg-red-600/20 text-red-400 border-red-400/30'
                      }`}
                    >
                      {product.inventory_quantity > 0 ? `${product.inventory_quantity} left` : 'Out of Stock'}
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-4">
                  {/* Product Name */}
                  <CardTitle className="text-lg text-white mb-2 line-clamp-2">
                    {product.name}
                  </CardTitle>
                  
                  {/* Product Description */}
                  <p className="text-sm text-gray-300 mb-4 line-clamp-3">
                    {product.description}
                  </p>
                  
                  {/* Price and Action */}
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold golden-accent">
                      ${product.price.toFixed(2)}
                    </div>
                    
                    <Button 
                      className="mystical-button"
                      size="sm"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.type === 'physical' && product.inventory_quantity === 0}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      {product.type === 'service' ? 'Book Now' : 'Add to Cart'}
                    </Button>
                  </div>
                  
                  {/* Product Meta */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-400">
                    <span>Added {product.created_at.toLocaleDateString()}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span>New</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
