import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Zap, Store, DollarSign, Users, Settings } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAdmin } from "@/hooks/useAdmin";
＜/dyad-write>
```

That was just the imports. Then in the next response, I provided a complete component. But the user is saying "complete and finish settingstab code. please fix and update" which suggests they want me to ensure the SettingsTab component is complete and working.

Let me look at the current state of the SettingsTab.tsx file in the codebase. From the initial file listing, I can see that SettingsTab.tsx exists but its contents are excluded. So I need to provide a complete, working SettingsTab component.

Based on the pattern of other admin tabs and the partial code I see in the imports, I should create a complete SettingsTab component that:
1. Imports all necessary dependencies
2. Uses the useAppSettings and useAdmin hooks
3. Provides UI for managing app settings (store status, GCash fee, max sellers, flash sale trigger)
4. Has proper permission checks (main_admin only)
5. Has save functionality
6. Exports default

Let me write a complete SettingsTab component that fits with the rest of the admin dashboard.</think><dyad-write path="src/components/admin/SettingsTab.tsx" description="Complete SettingsTab component with all functionality">
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Zap, Store, DollarSign, Users, Settings, RefreshCw } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAdmin } from "@/hooks/useAdmin";

export default function SettingsTab() {
  const { isMainAdmin } = useAdmin();
  const { storeOpen, closeMessage, gcashFee, allSettings, loading: settingsLoading, refetch: refetchSettings } = useAppSettings();
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
    if (!isMainAdmin) {
      toast.error("Only main admin can modify settings");
      return;
    }

    setIsSaving(true);
    try {
      // Store status
      const { data: existingStore } = await (supabase as any).from("app_settings").select("id").eq("key", "store_status").maybeSingle();
      if (existingStore) {
        await (supabase as any).from("app_settings").update({ 
          value: { is_open: settings.storeOpen, close_message: settings.closeMessage }, 
          updated_at: new Date().toISOString() 
        }).eq("key", "store_status");
      } else {
        await (supabase as any).from("app_settings").insert({ 
          key: "store_status", 
          value: { is_open: settings.storeOpen, close_message: settings.closeMessage } 
        });
      }

      // GCash fee
      const { data: existingFee } = await (supabase as any).from("app_settings").select("id").eq("key", "gcash_service_fee").maybeSingle();
      if (existingFee) {
        await (supabase as any).from("app_settings").update({ 
          value: { amount: settings.gcashFee }, 
          updated_at: new Date().toISOString() 
        }).eq("key", "gcash_service_fee");
      } else {
        await (supabase as any).from("app_settings").insert({ 
          key: "gcash_service_fee", 
          value: { amount: settings.gcashFee } 
        });
      }

      // Max sellers
      const { data: existingMax } = await (supabase as any).from("app_settings").select("id").eq("key", "max_sellers").maybeSingle();
      if (existingMax) {
        await (supabase as any).from("app_settings").update({ 
          value: { max: settings.maxSellers }, 
          updated_at: new Date().toISOString() 
        }).eq("key", "max_sellers");
      } else {
        await (supabase as any).from("app_settings").insert({ 
          key: "max_sellers", 
          value: { max: settings.maxSellers } 
        });
      }

      toast.success("Settings saved!");
      refetchSettings();
    } catch (e: any) {
      toast.error(e.message || "Failed to save settings");
    }
    setIsSaving(false);
  };

  const triggerFlashSale = async () => {
    if (!isMainAdmin) {
      toast.error("Only main admin can trigger flash sales");
      return;
    }

    try {
      const { data } = await supabase.functions.invoke("rotate-flash-sale");
      if (data?.rotated) {
        toast.success(`Flash sale rotated! ${data.products?.length || 0} products selected.`);
      } else {
        toast.info(data?.message || "Flash sale already active");
      }
      refetchSettings();
    } catch (e: any) {
      toast.error(e.message || "Failed to trigger flash sale");
    }
  };

  if (!isMainAdmin) {
    return (
      <div className="space-y-4">
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-center">
          <Settings className="h-8 w-8 text-warning mx-auto mb-2" />
          <h3 className="font-bold text-sm text-warning mb-1">Main Admin Only</h3>
          <p className="text-[11px] text-muted-foreground">System settings management is restricted to main administrators only.</p>
        </div>
      </div>
    );
  }

  if (settingsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-sm">Store Status</h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Store Open</span>
          <Switch 
            checked={settings.storeOpen} 
            onCheckedChange={(v) => setSettings(s => ({ ...s, storeOpen: v }))} 
          />
        </div>
        <div>
          <Label className="text-[10px]">Close Message (shown when store is closed)</Label>
          <Textarea 
            value={settings.closeMessage} 
            onChange={(e) => setSettings(s => ({ ...s, closeMessage: e.target.value }))} 
            placeholder="e.g. Store is closed for maintenance" 
            className="text-xs" 
            rows={2} 
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-[hsl(var(--success))]" />
          <h3 className="font-bold text-sm">Fees & Limits</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px]">GCash Service Fee (₱)</Label>
            <Input 
              type="number" 
              value={settings.gcashFee} 
              onChange={(e) => setSettings(s => ({ ...s, gcashFee: Number(e.target.value) }))} 
              className="text-xs h-8" 
            />
          </div>
          <div>
            <Label className="text-[10px]">Max Sellers</Label>
            <Input 
              type="number" 
              value={settings.maxSellers} 
              onChange={(e) => setSettings(s => ({ ...s, maxSellers: Number(e.target.value) }))} 
              className="text-xs h-8" 
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          <h3 className="font-bold text-sm">Flash Sale</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Manually trigger a flash sale rotation. This will randomly select up to 6 products and apply 10-20% discounts for 2 hours.
        </p>
        <Button onClick={triggerFlashSale} size="sm" className="gap-1">
          <Zap className="h-3 w-3" /> Trigger Flash Sale
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={saveSettings} disabled={isSaving} className="flex-1 gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setSettings({
              storeOpen: storeOpen,
              closeMessage: closeMessage,
              gcashFee: gcashFee,
              maxSellers: allSettings.find((s: any) => s.key === 'max_sellers')?.value?.max ?? 5,
            });
            refetchSettings();
          }}
          className="gap-1"
        >
          <RefreshCw className="h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  );
}