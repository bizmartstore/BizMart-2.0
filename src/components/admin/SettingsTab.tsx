import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Zap, Store, DollarSign, Users } from "lucide-react";

export default function SettingsTab() {
  const { storeOpen, closeMessage, gcashFee, allSettings, loading: settingsLoading } = useAppSettings();
  const [settings, setSettings] = useState({
    storeOpen: storeOpen,
    closeMessage: closeMessage,
    gcashFee: gcashFee,
    maxSellers: 5,
  });

  useEffect(() => {
    // Extract maxSellers from allSettings
    const maxSellersSetting = allSettings.find((s: any) => s.key === 'max_sellers');
    const maxSellers = maxSellersSetting?.value?.max ?? 5;
    setSettings(prev => ({ ...prev, maxSellers }));
  }, [allSettings]);

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Store status      const { data: existingStore } = await (supabase as any).from("app_settings").select("id").eq("key", "store_status").maybeSingle();
      if (existingStore) {
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
    setLoading(false);
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

  return (
    <div className="space-y-4">
      {/* Store Status */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
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

      {/* Fees */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-[hsl(var(--success))]" />
          <h3 className="font-bold text-sm">Fees & Limits</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px]">GCash Service Fee (₱)</Label>
            <Input type="number" value={settings.gcashFee} onChange={(e) => setSettings(s => ({ ...s, gcashFee: Number(e.target.value) }))} className="text-xs h-8" />
          </div>
          <div>
            <Label className="text-[10px]">Max Sellers</Label>
            <Input type="number" value={settings.maxSellers} onChange={(e) => setSettings(s => ({ ...s, maxSellers: Number(e.target.value) }))} className="text-xs h-8" />
          </div>
        </div>
      </div>

      {/* Flash Sale */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          <h3 className="font-bold text-sm">Flash Sale</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">Manually trigger a flash sale rotation. This will randomly select up to 6 products and apply 10-20% discounts for 2 hours.</p>
        <Button onClick={triggerFlashSale} size="sm" className="gap-1"><Zap className="h-3 w-3" /> Trigger Flash Sale</Button>
      </div>

      <Button onClick={saveSettings} disabled={settingsLoading} className="w-full gap-2">
        {settingsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {settingsLoading ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}