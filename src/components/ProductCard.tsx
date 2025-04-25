'use client';
import Image from 'next/image';
import { Product } from '@/types/product';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      <div className="relative h-64 w-full">
        <Image
          src={product.image.url}
          alt={product.image.alt}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">${product.discountedPrice}</span>
            {product.discountedPrice < product.price && (
              <span className="text-sm text-gray-500 line-through">${product.price}</span>
            )}
          </div>
          <div className="flex items-center">
            {'★'.repeat(product.rating)}{'☆'.repeat(5-product.rating)}
          </div>
        </div>
        <div className="mt-auto pt-4">
          <Link href={`/product/${product.id}`} className="block">
            <button className="w-full bg-custom-button text-white py-2 rounded-md hover:bg-blue-950 transition-colors">
              See Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;