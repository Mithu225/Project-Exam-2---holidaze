// src/types/product.ts
export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    discountedPrice: number;
    image: {
      url: string;
      alt: string;
    };
    rating: number;
    tags: string[];
    reviews: {
      id: string;
      username: string;
      rating: number;
      description: string;
    }[];
  }