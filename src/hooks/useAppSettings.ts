import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAppSettings() {
  const [storeOpen, setStoreOpen] = useState(true);
  const [closeMessage, setCloseMessage] = useState("");
  const [gcashFee, setGcashFee] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any).from('app_settings').select('*')
      .then(({ data }: any) => {
        if (data) {
          const storeStatus = data.find((s: any) => s.key === 'store_status');
          const fee = data.find((s: any) => s.key === 'gcash_service_fee');
          if (storeStatus && storeStatus.value) {
            setStoreOpen(storeStatus.value.is_open ?? true);
            setCloseMessage(storeStatus.value.close_message || '');
          }
          if (fee && fee.value) setGcashFee(fee.value.amount ?? 10);
        }
        setLoading(false);
      });
  }, []);

  return { storeOpen, closeMessage, gcacheFee: gcashFee, loading };
}