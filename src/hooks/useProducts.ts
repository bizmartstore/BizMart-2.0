import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  products as fallbackProducts,
  categories as fallbackCategories,
  Product,
} from "@/data/products";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("products")
          .select("*")
          .or("is_active.eq.true,is_active.is.null")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[useProducts] Supabase error:", error.message);
          return fallbackProducts;
        }

        if (data && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : undefined,
            image: p.image || "",
            images: p.images || [],
            category: p.category || "",
            rating: Number(p.rating),
            sold: p.sold || 0,
            stock: p.stock ?? 0,
            description: p.description || "",
            isFlashSale: !!p.is_flash_sale,
            // Pass these through for the components to use
            sale_price: p.sale_price,
            discount_percent: p.discount_percent,
            original_price: p.original_price,
            seller_id: p.seller_id || null,
          })) as Product[];
        }

        return fallbackProducts;
      } catch (err: any) {
        console.error("[useProducts] Unexpected error:", err);
        return fallbackProducts;
      }
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 1,
  });
}

export function useFlashSaleProducts() {
  return useQuery({
    queryKey: ["flash-sale-products"],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("flash_sale_products")
          .select("*");

        if (error) {
          console.error("[useFlashSaleProducts] Supabase error:", error.message);
          return [];
        }

        if (data) {
          return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : undefined,
            image: p.image || "",
            images: p.images || [],
            category: p.category || "",
            rating: Number(p.rating),
            sold: p.sold || 0,
            stock: p.stock ?? 0,
            description: p.description || "",
            isFlashSale: true,
            sale_price: p.sale_price,
            discount_percent: p.discount_percent,
            original_price: p.original_price,
            seller_id: p.seller_id || null,
          })) as Product[];
        }

        return [];
      } catch (err: any) {
        console.error("[useFlashSaleProducts] Unexpected error:", err);
        return [];
      }
    },
    staleTime: 60000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) {
        console.warn("Failed to fetch categories from DB, using fallback:", error);
        return fallbackCategories;
      }

      if (data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
        }));
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
  return products?.find((p) => p.id === id);
}

export function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) {
        console.warn("Failed to fetch banners from DB:", error);
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