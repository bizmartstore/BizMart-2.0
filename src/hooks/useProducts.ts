import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as fallbackProducts, categories as fallbackCategories, Product } from "@/data/products";

// Helper to safely parse images from DB (handles text[], jsonb, or string)
function parseImages(p: any): string[] {
  if (Array.isArray(p.images)) return p.images;
  if (typeof p.images === 'string') {
    try {
      // Try JSON parse first
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    // Fallback to comma-separated or Postgres array format {url1,url2}
    const cleaned = p.images.replace(/[{}]/g, '');
    return cleaned.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  if (p.image) return [p.image];
  return [];
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        console.warn('Failed to fetch products from DB, using fallback:', error);
        return fallbackProducts;
      }
      
      if (data && data.length > 0) {
        return data.map((p: any) => {
          const imgs = parseImages(p);
          return {
            id: p.id,
            name: p.name,
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : undefined,
            image: imgs[0] || p.image || '',
            images: imgs,
            category: p.category || '',
            rating: Number(p.rating),
            sold: p.sold || 0,
            stock: p.stock ?? 0,
            description: p.description || '',
            isFlashSale: p.is_flash_sale || false,
            seller_id: p.seller_id || null,
          } as Product & { seller_id?: string };
        });
      }
      return fallbackProducts;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 2,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) {
        console.warn('Failed to fetch categories from DB, using fallback:', error);
        return fallbackCategories;
      }
      
      if (data && data.length > 0) {
        return data.map((c: any) => ({ id: c.id, name: c.name, icon: c.icon }));
      }
      return fallbackCategories;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 2,
  });
}

export function useProduct(id: string) {
  const { data: products } = useProducts();
  return products?.find(p => p.id === id);
}

export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) {
        console.warn('Failed to fetch banners from DB:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        return data.map((b: any) => b.image_url) as string[];
      }
      return null;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 2,
  });
}