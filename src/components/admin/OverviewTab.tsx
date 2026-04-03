import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save, Loader2, Zap, Store, DollarSign, Users, LogOut } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SettingsTab() {
  const { storeOpen, closeMessage, gcashFee, allSettings, loading: settingsLoading } = useAppSettings();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    storeOpen: storeOpen,
    closeMessage: closeMessage,
    gcashFee: gcashFee,
    maxSellers: 5,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const maxSellersSetting = allSettings.find((s: any) => s.key === 'max_sellers');
    const maxSellers = maxSellersSetting?.value?.max ?? 5;
    setSettings(prev => ({ ...prev, maxSellers }));
  }, [allSettings]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { data: existingStore } = await (supabase as any).from("app_settings").select("id").eq("key", "store_status").maybeSingle();
      if (existingStore) {
        await (supabase as any).from("app_settings").update({ value: { is_open: settings.storeOpen, close_message: settings.closeMessage }, updated_at: new Date().toISOString() }).eq("key", "store_status");
      } else {
        await (supabase as any).from("app_settings").insert({ key: "store_status", value: { is_open: settings.storeOpen, close_message: settings.closeMessage } });
      }

      const { data: existingFee } = await (supabase as any).from("app_settings").select("id").eq("key", "gcash_service_fee").maybeSingle();
      if (existingFee) {
        await (supabase as any).from("app_settings").update({ value: { amount: settings.gcashFee }, updated_at: new Date().toISOString() }).eq("key", "gcash_service_fee");
      } else {
        await (supabase as any).from("app_settings").insert({ key: "gcash_service_fee", value: { amount: settings.gcashFee } });
      }

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
    setIsSaving(false);
  };

  const triggerFlashSale = async () => {
    try {
      const { data } = await supabase.functions.invoke("rotate-flash-sale");
      if (data?.rotated) {
        toast.success(`Flash sale rotated! ${data.products?.length || 0} products selected.`);
      } else {
        toast.info(data?.message || "Flash sale already active");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to trigger flash sale");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Store className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-sm">Store Status</h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Store Open</span>
          <Switch checked={settings.storeOpen} onCheckedChange={(v) => setSettings(s => ({ ...s, storeOpen: v }))} />
        </div>
        <div>
          <Label className="text-[10px]">Close Message (shown when store is closed)</Label>
          <Textarea value={settings.closeMessage} onChange={(e) => setSettings(s => ({ ...s, closeMessage: e.target.value }))} placeholder="e.g. Store is closed for maintenance" className="text-xs" rows={2} />
        </div>
      </div>

      <Button onClick={saveSettings} disabled={isSaving} className="w-full gap-2">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>

      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
        <h3 className="font-bold text-sm text-destructive mb-2">Danger Zone</h3>
        <p className="text-[10px] text-muted-foreground mb-3">Log out of your admin account and return to the login page.</p>
        <Button onClick={handleLogout} variant="destructive" className="w-full gap-2">
          <LogOut className="h-4 w-4" /> Log Out
        </Button>
      </div>
    </div>
  );
}