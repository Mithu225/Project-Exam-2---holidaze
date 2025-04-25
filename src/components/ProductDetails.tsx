'use client';
import Image from 'next/image';
import { Product } from '@/types/product';
import { Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface ProductDetailsProps {
  productId: string;
}

export default function ProductDetails({ productId }: ProductDetailsProps) {
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`https://v2.api.noroff.dev/online-shop/${productId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.statusText}`);
        }
        const data = await response.json();
        setProduct(data.data);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load product details';
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-white-400 text-gray-400'
        }`}
      />
    ));
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!product) return <div className="text-center py-8">Product not found</div>;

  const handleAddToCart = () => {
    addToCart(product);
  };

  const handleBuyMore = () => {
   
    router.push ('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-100 rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 p-6">
          <div className="relative h-[500px]">
            <Image
              src={product.image.url}
              alt={product.image.alt}
              fill
              className="object-cover rounded-lg"
            />
          </div>

          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-gray-900">${product.discountedPrice}</span>
              {product.discountedPrice < product.price && (
                <span className="text-lg text-gray-500 line-through">${product.price}</span>
              )}
            </div>

            <div className="flex items-center mb-4">
              <div className="flex">{renderStars(product.rating)}</div>
              <span className="ml-2 text-gray-600">({product.rating} out of 5)</span>
            </div>

            <p className="text-gray-600 mb-6">{product.description}</p>

            <div className="flex  flex-row gap-4 mt-auto">
              
              <button onClick={handleAddToCart} className=" bg-custom-button text-white py-3 px-6 rounded-md hover:bg-blue-950 transition-colors">
                Add to Cart
              </button>
              <button 
                onClick={handleBuyMore}
                className="p-2 bg-custom-button text-white py-2 rounded-md hover:bg-blue-950 transition-colors"
              >
                Back to home
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
          {product.reviews.length > 0 ? (
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{review.username}</span>
                    <div className="flex items-center">
                      <div className="flex">{renderStars(review.rating)}</div>
                    </div>
                  </div>
                  <p className="text-gray-600">{review.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}