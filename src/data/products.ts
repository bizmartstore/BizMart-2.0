export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[]; // Additional images for carousel
  category: string;
  rating: number;
  sold: number;
  stock?: number;
  description: string;
  isFlashSale?: boolean;
  bcoins?: number; // BCoins earned from purchasing this product
}