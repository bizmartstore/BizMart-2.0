// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  useEffect(() => {
    const loadStore = async () => {
      if (isOfficial) {
        // Load all active products for the BizMart official store
        const { data: prods } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("sold", { ascending: false });
        setProducts(prods || []);
        setLoading(false);
      } else {
        // Load seller profile using id (not user_id)
        const { data: sellerData } = await supabase
          .from("seller_profiles")
          .select("*")
          .eq("id", sellerId) // Use id, not user_id
          .maybeSingle();
        setStore(sellerData);

        // Load seller's products - products table has seller_id foreign key
        const { data: sellerProducts } = await supabase
          .from("products")
          .select("*")
          .eq("seller_id", sellerId)
          .eq("is_active", true);
        setProducts(sellerProducts || []);
        setLoading(false);
      }
    };
    loadStore();
  }, [sellerId, isOfficial]);

// ... (rest of component)