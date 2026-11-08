import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Zap, Store, DollarSign, LogOut, Trash2 } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";

/** Tables whose rows are wiped when the main admin resets all data. */
const RESET_TABLES = [
  "payment_references",
  "bcoins_transactions",
  "bcoins_redemptions",
  "organization_transactions",
  "gcash_transactions",
  "print_orders",
  "orders",
] as const;

export default function SettingsTab() {
  const { storeOpen, closeMessage, gcashFee, allSettings } = useAppSettings();
  const { signOut } = useAuth();
  const { isMainAdmin } = useAdmin();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    storeOpen: storeOpen,
    closeMessage: closeMessage,
    gcashFee: gcashFee,
    maxSellers: 5,
    flashSaleMinDiscount: 5,
    flashSaleMaxDiscount: 10,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    const maxSellersSetting = allSettings.find((s: any) => s.key === 'max_sellers');
    const flashSaleMinSetting = allSettings.find((s: any) => s.key === 'flash_sale_min_discount');
    const flashSaleMaxSetting = allSettings.find((s: any) => s.key === 'flash_sale_max_discount');
    
    setSettings({ 
      storeOpen,
      closeMessage,
      gcashFee,
      maxSellers: maxSellersSetting?.value?.max ?? 5,
      flashSaleMinDiscount: flashSaleMinSetting?.value?.percentage ?? 5,
      flashSaleMaxDiscount: Math.min(10, flashSaleMaxSetting?.value?.percentage ?? 10),
    });
  }, [allSettings, storeOpen, closeMessage, gcashFee]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { key: "store_status", value: { is_open: settings.storeOpen, close_message: settings.closeMessage } },
        { key: "gcash_service_fee", value: { amount: settings.gcashFee } },
        { key: "max_sellers", value: { max: settings.maxSellers } },
        { key: "flash_sale_min_discount", value: { percentage: 5 } },
        { key: "flash_sale_max_discount", value: { percentage: 10 } },
      ];

      for (const { key, value } of updates) {
        const { data: existing } = await (supabase as any).from("app_settings").select("id").eq("key", key).maybeSingle();
        if (existing) {
          await (supabase as any).from("app_settings").update({ value }).eq("key", key);
        } else {
          await (supabase as any).from("app_settings").insert({ key, value });
        }
      }

      toast.success("Settings saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save settings");
    }
    setIsSaving(false);
  };

  const triggerFlashSale = async () => {
    setIsRotating(true);
    try {
      // Force rotation by passing the custom header
      const { data, error } = await supabase.functions.invoke("rotate-flash-sale", {
        headers: {
          "x-force-rotate": "true"
        }
      });
      
      if (error) throw error;

      if (data?.rotated) {
        toast.success(`New Flash Sale active! ${data.count || 0} products selected with 5-10% discounts.`);
      } else {
        toast.info(data?.message || "Flash sale rotated");
      }
    } catch (e: any) {
      console.error("[SettingsTab] Flash sale trigger failed:", e);
      toast.error("Failed to trigger flash sale. Please try again.");
    } finally {
      setIsRotating(false);
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

  // ---------------- Reset All Customer Data ----------------
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetSummary, setResetSummary] = useState<string[] | null>(null);

  const handleResetAll = async () => {
    if (!isMainAdmin) {
      toast.error("Only the main admin can reset data.");
      return;
    }
    if (resetConfirmText.trim().toUpperCase() !== "RESET") {
      toast.error('Type "RESET" exactly to confirm.');
      return;
    }

    const confirmed = window.confirm(
      "⚠️ FINAL WARNING ⚠️\n\nThis PERMANENTLY deletes all customer orders, printing orders, GCash records, org transactions, BizCoin history, and resets all wallet balances to 0.\n\nBanners, products, categories, users and accounts are NOT touched.\n\nThis cannot be undone. Proceed?"
    );
    if (!confirmed) return;

    setIsResetting(true);
    setResetSummary(null);
    try {
      // Preferred path: SECURITY DEFINER RPC (bypasses RLS, restricted to main_admin)
      const { data, error: rpcError } = await (supabase as any).rpc("reset_all_customer_data");

      if (!rpcError) {
        const lines: string[] = [];
        for (const [table, status] of Object.entries(data || {})) {
          lines.push(status === "ok" ? `✅ ${table.replace(/_/g, " ")} cleared` : `⚠️ ${table.replace(/_/g, " ")}: ${status}`);
        }
        setResetSummary(lines);
        toast.success("All customer data has been reset. Refreshing dashboard...");
        // Reload so every tab and stat (Overview, Orders, GCash, Print)
        // immediately reflects the cleared data.
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      // Fallback: direct deletes (works only if RLS permits; RPC is recommended)
      const lines: string[] = [];
      let failed = false;

      for (const table of RESET_TABLES) {
        const { error } = await (supabase as any)
          .from(table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) {
          failed = true;
          lines.push(`⚠️ ${table.replace(/_/g, " ")}: ${error.message}`);
        } else {
          lines.push(`✅ ${table.replace(/_/g, " ")} cleared`);
        }
      }

      const { error: walletError } = await (supabase as any)
        .from("bcoins_wallets")
        .update({ balance: 0 })
        .neq("balance", 0);
      lines.push(walletError ? `⚠️ BizCoin wallets: ${walletError.message}` : "✅ BizCoin wallets set to 0");

      const { error: orgWalletError } = await (supabase as any)
        .from("organization_wallets")
        .update({ balance: 0 })
        .neq("balance", 0);
      lines.push(orgWalletError ? `⚠️ Org wallets: ${orgWalletError.message}` : "✅ Org wallets set to 0");

      setResetSummary(lines);
      if (failed) {
        toast.warning("Some tables could not be cleared.", {
          description: "Run supabase/sql/reset_all_customer_data.sql in the Supabase SQL Editor to enable the secure reset.",
        });
      } else {
        toast.success("All customer data has been reset. Refreshing dashboard...");
        // Reload so every tab and stat immediately reflects the cleared data.
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (e: any) {
      toast.error(e.message || "Reset failed");
    } finally {
      setIsResetting(false);
      setResetConfirmText("");
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
          <h3 className="font-bold text-sm">Flash Sale Rules</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">Discounts are now strictly limited between 5% and 10% per your request.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px]">Min Discount (%)</Label>
            <Input type="number" value={5} disabled className="text-xs h-8 bg-muted" />
          </div>
          <div>
            <Label className="text-[10px]">Max Discount (%)</Label>
            <Input type="number" value={10} disabled className="text-xs h-8 bg-muted" />
          </div>
        </div>
        <Button onClick={triggerFlashSale} disabled={isRotating} size="sm" className="gap-1">
          {isRotating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
          Trigger New 5-10% Flash Sale
        </Button>
      </div>

      <Button onClick={saveSettings} disabled={isSaving} className="w-full gap-2">
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>

      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
        <h3 className="font-bold text-sm text-destructive mb-2">Reset All Customer Data</h3>
        <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
          Permanently deletes <span className="font-bold">all orders (incl. printing)</span>,{" "}
          <span className="font-bold">GCash records</span>, org transactions, BizCoin history and resets
          <span className="font-bold"> all earnings / wallet balances to 0</span>. Banners, products, categories, users
          and accounts are <span className="font-bold">not</span> affected.
        </p>
        <Input
          value={resetConfirmText}
          onChange={(e) => setResetConfirmText(e.target.value)}
          placeholder='Type "RESET" to enable the button'
          className="text-xs h-9 mb-2"
          disabled={isResetting}
        />
        <Button
          onClick={handleResetAll}
          disabled={isResetting || resetConfirmText.trim().toUpperCase() !== "RESET"}
          variant="destructive"
          className="w-full gap-2"
        >
          {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {isResetting ? "Resetting all data..." : "Reset All Customer Data"}
        </Button>
        {resetSummary && (
          <div className="mt-3 space-y-1 rounded-lg bg-card border border-border p-2">
            {resetSummary.map((line, i) => (
              <p key={i} className="text-[10px] text-muted-foreground leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

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