// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('app_settings').select('*');
      
      if (error) {
        console.warn('Failed to load app settings:', error);
        setLoading(false);
        return;
      }
      
      if (data) {
        setAllSettings(data);
        const storeStatus = data.find((s: any) => s.key === 'store_status');
        const fee = data.find((s: any) => s.key === 'gcash_service_fee');
        if (storeStatus && storeStatus.value) {
          setStoreOpen(storeStatus.value.is_open ?? true);
          setCloseMessage(storeStatus.value.close_message || '');
        }
        if (fee && fee.value) setGcashFee(fee.value.amount ?? 10);
      }
    } catch (err) {
      console.error('Error loading app settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

// ... (rest of component)