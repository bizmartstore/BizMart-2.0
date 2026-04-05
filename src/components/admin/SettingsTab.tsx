import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
    // New setting for flash sale max discount
    flashSaleMaxDiscount: 20, // default value
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Initialize with existing flash sale max discount value
    const flashSaleMaxDiscount = allSettings.find((s: any) => s.key === "flash_sale_max_discount");
    if (flashSaleMaxDiscount?.value?.max) {
      setSettings(prev => ({ ...prev, flashSaleMaxDiscount: parseInt(flashSaleMaxDiscount.value.max) }));
    }
  }, [allSettings]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save core settings
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

      // Save flash sale max discount
      const { error: discountError } = await (supabase as any).from("app_settings").upsert({
        key: "flash_sale_max_discount",
        value: { max: settings.flashSaleMaxDiscount },
      });
      if (discountError) throw discountError;

      toast.success("Settings saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Store Status Settings */}
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

      {/* Fees & Limits */}
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

      {/* Flash Sale Settings */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          <h3 className="font-bold text-sm">Flash Sale</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Manually trigger a flash sale rotation. This will randomly select up to 6 products and apply 10-20% discounts for 2 hours.
        </p>
        <Button onClick={triggerFlashSale} size="sm" className="gap-1"><Zap className="h-3 w-3" /> Trigger Flash Sale</Button>
      </div>

      {/* NEW: Flash Sale Max Discount Input */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold">Flash Sale Max Discount (%)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Maximum Discount %</Label>
            <Input
              type="number"
              min={5}
              max={15}
              value={settings.flashSaleMaxDiscount}
              onChange={(e) => setSettings(s => ({ ...s, flashSaleMaxDiscount: Number(e.target.value) }))}
              className="text-xs h-8"
              placeholder="e.g. 10"
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Maximum discount percentage applied during flash sales. Must be between 5 and 15.</p>
      </div>

      <Button onClick={saveSettings} disabled={isSaving} className="w-full gap-2">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>

      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
        <h3 className="font-bold text-sm text-destructive mb-2">Danger Zone</h3>
        <p className="text-[10px] text-muted-foreground mb-3">Log out of your admin account and return to the login page.</p>
        <Button onClick={handleLogout} variant="destructive" className="w-full gap-2">
          <LogOut className="h-4 w-4" /> Log Out        </Button>
      </div>
    </div>
  );
}
</dyad-file><dyad-write path="src/components/admin/SettingsTab.tsx">
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
    // New setting for flash sale max discount
    flashSaleMaxDiscount: 20, // default value
  };
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Initialize with existing flash sale max discount value
    const flashSaleMaxDiscount = allSettings.find((s: any) => s.key === "flash_sale_max_discount");
    if (flashSaleMaxDiscount?.value?.max) {
      setSettings(prev => ({ ...prev, flashSaleMaxDiscount: parseInt(flashSaleMaxDiscount.value.max) }));
    }
  }, [allSettings]);

  const saveSettings = async () => {
    // Validate flashSaleMaxDiscount is between 5 and 15
    if (settings.flashSaleMaxDiscount < 5 || settings.flashSaleMaxDiscount > 15) {
      toast.error("Flash sale max discount must be between 5 and 15");
      return;
    }
    setIsSaving(true);
    try {
      // Save core settings      const { data: existingStore } = await (supabase as any).from("app_settings").select("id").eq("key", "store_status").maybeSingle();
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

      // Save flash sale max discount
      const { error: discountError } = await (supabase as any).from("app_settings").upsert({
        key: "flash_sale_max_discount",
        value: { max: settings.flashSaleMaxDiscount },
      });
      if (discountError) throw discountError;

      toast.success("Settings saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
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
      {/* Store Status Settings */}
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

      {/* Fees & Limits */}
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

      {/* Flash Sale Settings */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          <h3 className="font-bold text-sm">Flash Sale</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Manually trigger a flash sale rotation. This will randomly select up to 6 products and apply 10-20% discounts for 2 hours.
        </p>
        <Button onClick={triggerFlashSale} size="sm" className="gap-1"><Zap className="h-3 w-3" /> Trigger Flash Sale</Button>
      </div>

      {/* Flash Sale Max Discount Input */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold">Maximum Discount %</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Maximum Discount %</Label>
            <Input
              type="number"
              min={5}
              max={15}
              value={settings.flashSaleMaxDiscount}
              onChange={(e) => setSettings(s => ({ ...s, flashSaleMaxDiscount: Number(e.target.value) }))}
              className="text-xs h-8"
              placeholder="e.g. 10"
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Maximum discount percentage applied during flash sales. Must be between 5 and 15.</p>
      </div>

      <Button onClick={saveSettings} disabled={isSaving} className="w-full gap-2">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>

      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
        <h3 className="font-bold text-sm text-destructive mb-2">Danger Zone</h3>
        <p className="text-[10px] text-muted-foreground mb-3">Log out of your admin account and return to the login page.</p>
        <Button onClick={handleLogout} variant="destructive" className="w-full gap-2">
          <LogOut className="h-4 w-4" /> Log Out        </Button>
      </div>
    </div>
  );
}
</dyad-file><dyad-write path="src/components/admin/SettingsTab.tsx">
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
    flashSaleMaxDiscount: 15, // Default max discount
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const maxSellersSetting = allSettings.find((s: any) => s.key === 'max_sellers');
    const maxSellers = maxSellersSetting?.value?.max ?? 5;
    
    const flashSaleDiscountSetting = allSettings.find((s: any) => s.key === 'flash_sale_max_discount');
    const flashSaleMaxDiscount = flashSaleDiscountSetting?.value?.max ?? 15;

    setSettings(prev => ({ 
      ...prev, 
      maxSellers, 
      flashSaleMaxDiscount 
    }));
  }, [allSettings]);

  const saveSettings = async () => {
    if (settings.flashSaleMaxDiscount < 5 || settings.flashSaleMaxDiscount > 15) {
      toast.error("Flash sale max discount must be between 5% and 15%");
      return;
    }

    setIsSaving(true);
    try {
      // Save store status
      const { data: existingStore } = await (supabase as any).from("app_settings").select("id").eq("key", "store_status").maybeSingle();
      if (existingStore) {
        await (supabase as any).from("app_settings").update({ value: { is_open: settings.storeOpen, close_message: settings.closeMessage }, updated_at: new Date().toISOString() }).eq("key", "store_status");
      } else {
        await (supabase as any).from("app_settings").insert({ key: "store_status", value: { is_open: settings.storeOpen, close_message: settings.closeMessage } });
      }

      // Save GCash fee
      const { data: existingFee } = await (supabase as any).from("app_settings").select("id").eq("key", "gcash_service_fee").maybeSingle();
      if (existingFee) {
        await (supabase as any).from("app_settings").update({ value: { amount: settings.gcashFee }, updated_at: new Date().toISOString() }).eq("key", "gcash_service_fee");
      } else {
        await (supabase as any).from("app_settings").insert({ key: "gcash_service_fee", value: { amount: settings.gcashFee } });
      }

      // Save max sellers
      const { data: existingMax } = await (supabase as any).from("app_settings").select("id").eq("key", "max_sellers").maybeSingle();
      if (existingMax) {
        await (supabase as any).from("app_settings").update({ value: { max: settings.maxSellers }, updated_at: new Date().toISOString() }).eq("key", "max_sellers");
      } else {
        await (supabase as any).from("app_settings").insert({ key: "max_sellers", value: { max: settings.maxSellers } });
      }

      // Save flash sale max discount
      const { data: existingDiscount } = await (supabase as any).from("app_settings").select("id").eq("key", "flash_sale_max_discount").maybeSingle();
      if (existingDiscount) {
        await (supabase as any).from("app_settings").update({ value: { max: settings.flashSaleMaxDiscount }, updated_at: new Date().toISOString() }).eq("key", "flash_sale_max_discount");
      } else {
        await (supabase as any).from("app_settings").insert({ key: "flash_sale_max_discount", value: { max: settings.flashSaleMaxDiscount } });
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

      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          <h3 className="font-bold text-sm">Flash Sale</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">Manually trigger a flash sale rotation. This will randomly select up to 6 products and apply discounts for 2 hours.</p>
        <Button onClick={triggerFlashSale} size="sm" className="gap-1"><Zap className="h-3 w-3" /> Trigger Flash Sale</Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold">Flash Sale Discount Limits</span>
        </div>
        <div>
          <Label className="text-[10px]">Maximum Discount (%)</Label>
          <Input 
            type="number" 
            min={5} 
            max={15} 
            value={settings.flashSaleMaxDiscount} 
            onChange={(e) => setSettings(s => ({ ...s, flashSaleMaxDiscount: Math.min(15, Math.max(5, Number(e.target.value))) }))} 
            className="text-xs h-8" 
          />
          <p className="text-[9px] text-muted-foreground mt-1">Discounts will be randomly applied between 5% and this maximum value (5-15%).</p>
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
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}