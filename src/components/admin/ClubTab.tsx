import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2, Package, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ClubTab() {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [appForm, setAppForm] = useState({ full_name: "", reason: "", business_type: "", products_to_sell: "", experience: "" });
  const [submittingApp, setSubmittingApp] = useState(false);
  const [activatingSeller, setActivatingSeller] = useState(false);
  const [sellerCount, setSellerCount] = useState(0);
  const [maxSellers, setMaxSellers] = useState(5);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("club_memberships").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle()
      .then(({ data }: any) => {
        setSelectedMembership(data);
        setLoading(false);
      });
    (supabase as any).from("seller_profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }: any) => setApplication(data));
    (supabase as any).from("seller_profiles").select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .then(({ count }: any) => setSellerCount(count || 0));
    (supabase as any).from("app_settings").select("*").eq("key", "max_sellers").maybeSingle()
      .then(({ data }: any) => {
        if (data?.value?.max) setMaxSellers(data.value.max);
    });
  }, [user]);

  const handleRedeemCode = async () => {
    if (!code.trim() || !user) return;
    setLoading(true);
    try {
      const { data: codeData, error: codeError } = await (supabase as any)
        .from("club_codes")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("is_used", false)
        .maybeSingle();

      if (codeError || !codeData) {
        toast({ title: "Invalid Code", description: "This code is invalid or already used.", variant: "destructive" });
        setLoading(false);
        return;
      }

      await (supabase as any).from("club_codes").update({ is_used: true, used_by: user.id }).eq("id", codeData.id);

      const count = Math.floor(Math.random() * 9000) + 1000;
      const controlNumber = `BZM-2026-${count}`;

      const { data: mem, error: memError } = await (supabase as any).from("club_memberships").insert({
        user_id: user.id,
        control_number: controlNumber,
        status: "active",
        membership_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        membership_type: "standard",
      }).select().single();

      if (memError) throw memError;
      setMembership(mem);
      const memberName = `${profile?.first_name || ""} ${profile?.last_name}`.trim() || "New Member";
      notifyAdminNewMember(memberName);
      toast({ title: "Welcome to BizMart Club! 🎉", description: "Your membership is now active." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!user || !appForm.full_name.trim() || !appForm.reason.trim() || !appForm.business_type.trim() || !appForm.products_to_sell.trim()) {
      toast({ title: "Incomplete", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setSubmittingApp(true);
    try {
      const { data, error } = await (supabase as any).from("seller_applications").insert({
        user_id: user.id,
        ...appForm,
      }).select().single();
      if (error) throw error;
      setApplication(data);
      setShowApplication(false);
      toast({ title: "Application Submitted! 📝", description: "Visit the store to complete your seller application." });
    } catch (e: any) {
      toast.error(e.message || "Failed to submit application");
    } finally {
      setSubmittingApp(false);
    }
  };

  const downloadId = async () => {
    if (!idRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(idRef.current, { scale: 3, useCORS: true, backgroundColor: null });
      const link = document.createElement("a");
      link.download = `BizMart-ID-${membership.control_number}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch {
      toast({ title: "Download failed", description: "Please take a screenshot instead.", variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Crown className="h-16 w-16 text-warning mb-4" />
          <h2 className="font-extrabold text-lg mb-2">BizMart Club</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to join or view your membership.</p>
          <Button onClick={() => navigate("/login")}>Login to Continue</Button>
        </div>
        <BottomNav />
      </div>
    </div>
  }

  const isPremium = membership?.membership_type === "premium";

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-3 mb-5">
          <Crown className="h-6 w-6 text-warning" />
          <h1 className="font-extrabold text-lg">BizMart Club</h1>
          {isPremium && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white">⭐ PREMIUM</span>
          )}
        </div>

        {/* No membership yet */}
        {!membership && !checkingMembership && (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm mb-1">Enter Your Club Code</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Pay at the ABM store in school to get your exclusive club code. Enter it below to activate your membership.
            </p>
            <Input
              placeholder="Enter code (e.g. BIZCLUB2026)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="mb-3 text-center font-bold"
            />
            <Button onClick={handleRedeemCode} disabled={loading || !code.trim()} className="w-full">
              {loading ? "Verifying..." : "Activate Membership"}
            </Button>
          </div>
        )}

        {/* Has membership - show ID card */}
        {membership && (
          <>
            <div className="flex flex-col items-center">
              <div className="relative z-10 flex-1"> {/* ... */}</div>
              {/* ... rest of the membership display ... */}
            </div>
          </>
        )}

        {/* Seller Section - Only for standard members without seller profile */}
        {!isPremium && !sellerProfile && (
          <div className="mt-6 space-y-3">
            {/* ... */}
          </div>
        )}

        {/* Seller already active - Go to store */}
        {sellerProfile && (
          <div className="mt-6">
            {/* ... */ }
          </div>
        )}

        {/* Bottom Nav */}
        <BottomNav />
      </div>
    </div>
  );
}