import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as fallbackProducts, categories as fallbackCategories, Product } from "@/data/products";

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      console.log('[useProducts] Fetching products from Supabase...');
      const { data, error } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[useProducts] Supabase error:', error.message);
        return fallbackProducts;
      }
      
      console.log(`[useProducts] Found ${data?.length || 0} products in DB`);
      
      if (data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          image: p.image || '',
          images: p.images || [],
          category: p.category || '',
          rating: Number(p.rating),
          sold: p.sold || 0,
          stock: p.stock ?? 0,
          description: p.description || '',
          isFlashSale: p.is_flash_sale || false,
          seller_id: p.seller_id || null,
        })) as Product[];
      }
      
      console.log('[useProducts] DB empty, falling back to defaults');
      return fallbackProducts;
    },
    staleTime: 30000, // 30 seconds instead of 5 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 1,
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