import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as fallbackProducts, categories as fallbackCategories, Product } from "@/data/products";

export function useInitialData() {
  return useQuery({
    queryKey: ['initial-data'],
    queryFn: async () => {
      const [productsRes, categoriesRes, settingsRes] = await Promise.all([
        (supabase as any).from('products').select('id, name, price, original_price, image, category, rating, stock, description, is_flash_sale, sale_price, discount_percent, created_at, seller_id').eq('is_active', true),
        (supabase as any).from('categories').select('id, name, icon').eq('is_active', true).order('sort_order'),
        (supabase as any).from('app_settings').select('*'),
      ]);

      let products: (Product & { seller_id?: string })[] = fallbackProducts;
      if (!productsRes.error && productsRes.data && productsRes.data.length > 0) {
        products = productsRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          image: p.image || '',
          category: p.category || '',
          rating: Number(p.rating),
          sold: p.sold || 0,
          stock: p.stock ?? 0,
          description: p.description || '',
          isFlashSale: !!p.is_flash_sale,
          sale_price: p.sale_price,
          discount_percent: p.discount_percent,
          original_price: p.original_price,
          seller_id: p.seller_id || null,
        }));
      }

      let categories = fallbackCategories;
      if (!categoriesRes.error && categoriesRes.data && categoriesRes.data.length > 0) {
        categories = categoriesRes.data.map((c: any) => ({ id: c.id, name: c.name, icon: c.icon }));
      }

      const settings = settingsRes.data || [];
      const storeStatus = settings.find((s: any) => s.key === 'store_status');
      const fee = settings.find((s: any) => s.key === 'gcash_service_fee');
      const flashSale = settings.find((s: any) => s.key === 'flash_sale_state');
      const maxSellers = settings.find((s: any) => s.key === 'max_sellers');

      return {
        products,
        categories,
        storeOpen: storeStatus?.value?.is_open ?? true,
        closeMessage: storeStatus?.value?.close_message || '',
        gcashFee: fee?.value?.amount ?? 10,
        maxSellers: maxSellers?.value?.max ?? 5,
        flashSaleEndsAt: flashSale?.value?.ends_at || null,
        allSettings: settings,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 2,
  });
}