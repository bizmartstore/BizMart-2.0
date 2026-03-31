import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Zap, Store, DollarSign, Users } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings"; // <-- Import added

export default function SettingsTab() {
  const { storeOpen, closeMessage, gcashFee, allSettings, loading: settingsLoading } = useAppSettings(); // <-- Use hook
  const [settings, setSettings] = useState({
    storeOpen: storeOpen,
    closeMessage: closeMessage,
    gcashFee: gcashFee,
    maxSellers: 5,
  });
  const [loading, setLoading] = useState(false); // <-- Define loading state

  useEffect(() => {
    // Extract maxSellers from allSettings
    const maxSellersSetting = allSettings.find((s: any) => s.key === 'max_sellers');
    const maxSellers = maxSellersSetting?.value?.max ?? 5;
    setSettings(prev => ({ ...prev, maxSellers }));
  }, [allSettings]);

  const saveSettings = async () => {
    setLoading(true); // <-- Now loading is defined
    try {
      // Store status
      const { data: existingStore } = await (supabase as any).from("app_settings").select("id").eq("key", "store_status").maybeSingle();
      if (existingStore) { // <-- Now defined
        await (supabase as any).from("app_settings").update({ value: { is_open: settings.storeOpen, close_message: settings.closeMessage }, updated_at: new Date().toISOString() }).eq("key", "store_status");
      } else {
        await (supabase as any).from("app_settings").insert({ key: "store_status", value: { is_open: settings.storeOpen, close_message: settings.closeMessage } });
      }

      // GCash fee
      const { data: existingFee } = await (supabase as any).from("app_settings").select("id").eq("key", "gcash_service_fee").maybeSingle();
      if (existingFee) {
        await (supabase as any).from("app_settings").update({ value: { amount: settings.gcashFee }, updated_at: new Date().toISOString() }).eq("key", "gcash_service_fee");
      } else {
        await (supabase as any).from("app_settings").insert({ key: "gcash_service_fee", value: { amount: settings.gcashFee } });
      }

      // Max sellers
      const { data: existingMax } = await (supabase as any).from("app_settings").select("id").eq("key", "max_sellers").maybeSingle();
      if (existingMax) {
        await (supabase as any).from("app_settings").update({ value: { max: settings.maxSellers }, updated_at: new Date().toISOString() }).eq("key", "max_sellers");
      } else {
        await (supabase as any).from("app_settings").insert({ key: "max_sellers", value: { max: settings.maxSellers } });
      }

      toast.success("Settings saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save settings");
    }
    setLoading(false); // <-- Now defined
  };

  return (
    <div className="space-y-4">
      {/* ... rest of component ... */}
    </div>
  );
}