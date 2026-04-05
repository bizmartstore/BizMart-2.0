import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import { Loader2, Package } from "lucide-react";

interface FlashSaleSettings {
  minDiscount: number;
  maxDiscount: number;
}

export default function FlashSaleSettingsTab() {
  const { isMainAdmin } = useAdmin();
  const [settings, setSettings] = useState<FlashSaleSettings>({
    minDiscount: 2,
    maxDiscount: 15,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("app_settings")
          .select("*")
          .maybeSingle();
        if (!error && data) {
          setSettings({
            minDiscount: Number(data.flash_sale_min_discount) || 2,
            maxDiscount: Number(data.flash_sale_max_discount) || 15,
          });
        }
      } catch (e: any) {
        console.error("Failed to load settings:", e);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (settings.minDiscount < 0 || settings.maxDiscount < 0) {
      toast.error("Discount values must be non‑negative");
      return;
    }
    if (settings.minDiscount >= settings.maxDiscount) {
      toast.error("Minimum discount must be less than maximum discount");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await (supabase as any).from("app_settings").upsert({
        key: "flash_sale_min_discount",
        value: { min: settings.minDiscount },
      });
      if (error) throw error;

      const { data: data2, error: error2 } = await (supabase as any).from("app_settings").upsert({
        key: "flash_sale_max_discount",
        value: { max: settings.maxDiscount },
      });
      if (error2) throw error2;

      toast.success("Flash‑sale discount range saved!");
    } catch (e: any) {
      console.error("Failed to save settings:", e);
      toast.error("Failed to save settings: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary">Flash‑Sale Discount Range</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px]">Minimum Discount (%)</Label>
            <Input
              type="number"
              value={settings.minDiscount}
              onChange={(e) => setSettings(s => ({ ...s, minDiscount: Number(e.target.value) }))}
              className="text-sm h-8 w-full rounded-md border border-input"
            />
          </div>
          <div>
            <Label className="text-[10px]">Maximum Discount (%)</Label>
            <Input
              type="number"
              value={settings.maxDiscount}
              onChange={(e) => setSettings(s => ({ ...s, maxDiscount: Number(e.target.value) }))}
              className="text-sm h-8 w-full rounded-md border border-input"
            />
          </div>
        </div>

        {!isMainAdmin && (
          <div className="text-center text-sm text-muted-foreground">
            Only Main Admin can modify these values.
          </div>
        )}

        <Button          onClick={handleSave}
          disabled={saving}
          className="w-full gap-2"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
          Save Discount Range
        </Button>
      </div>
    </div>
  );
}