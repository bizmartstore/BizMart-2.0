import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAppSettings() {
  const [storeOpen, setStoreOpen] = useState(true);
  const [closeMessage, setCloseMessage] = useState("");
  const [gcashFee, setGcashFee] = useState(10);
  const [allSettings, setAllSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any).from('app_settings').select('*');
      
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

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return { storeOpen, closeMessage, gcashFee, allSettings, loading, refetch: loadSettings };
}