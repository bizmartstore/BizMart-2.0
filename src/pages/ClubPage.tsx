"use client";

import { useState, useEffect, useRef } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Crown, Download, Shield, Store, Sparkles, ArrowRight, 
  FileText, Coins, CreditCard, Info, Star, ChevronRight, 
  Zap, Gift, Wallet, Disc, Loader2
} from "lucide-react";
import { notifyAdminNewMember } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import bizLogo from "@/assets/bizmart-logo.png";
import { useNavigate } from "react-router-dom";
import BCoinsFeatures from "@/components/BCoinsFeatures";

export default function ClubPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"membership" | "bcoins" | "seller">("membership");
  const [code, setCode] = useState("");
  const [sellerCode, setSellerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [membership, setMembership] = useState<any>(null);
  const [checkingMembership, setCheckingMembership] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [showApplication, setShowApplication] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [appForm, setAppForm] = useState({ full_name: "", reason: "", business_type: "", products_to_sell: "", experience: "" });
  const [submittingApp, setSubmittingApp] = useState(false);
  const [activatingSeller, setActivatingSeller] = useState(false);
  const [sellerCount, setSellerCount] = useState(0);
  const [maxSellers, setMaxSellers] = useState(5);
  const idRef = useRef<HTMLDivElement>(null);

  // BCoins related state moved here for integration
  const [wallet, setWallet] = useState<any>(null);
  const [bcoinsSection, setBcoinsSection] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Check membership
      (supabase as any).from("club_memberships").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle()
        .then(({ data }: any) => {
          setMembership(data);
          setCheckingMembership(false);
        });

      // Check seller profile
      (supabase as any).from("seller_profiles").select("*").eq("user_id", user.id).maybeSingle()
        .then(({ data }: any) => setSellerProfile(data));

      // Check existing application
      (supabase as any).from("seller_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
        .then(({ data }: any) => setApplication(data));
      
      // Load BCoins wallet
      (supabase as any).from("bcoins_wallets").select("*").eq("user_id", user.id).maybeSingle()
        .then(({ data }: any) => setWallet(data));
    } else {
      setCheckingMembership(false);
    }

    // Get seller count and max
    (supabase as any).from("seller_profiles").select("id", { count: "exact", head: true }).eq("is_active", true)
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
        .from("club_codes").select("*").eq("code", code.trim().toUpperCase()).eq("is_used", false).maybeSingle();

      if (codeError || !codeData) {
        toast({ title: "Invalid Code", description: "This code is invalid or already used.", variant: "destructive" });
        setLoading(false);
        return;
      }

      await (supabase as any).from("club_codes").update({ is_used: true, used_by: user.id }).eq("id", codeData.id);

      const count = Math.floor(Math.random() * 9000) + 1000;
      const controlNumber = `4532 ${count} ${Math.floor(Math.random()*9000)+1000} ${Math.floor(Math.random()*9000)+1000}`;

      const { data: mem, error: memError } = await (supabase as any)
        .from("club_memberships")
        .insert({
          user_id: user.id,
          control_number: controlNumber,
          status: "active",
          membership_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          membership_type: "standard",
        })
        .select().single();

      if (memError) throw memError;
      setMembership(mem);
      const memberName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "New Member";
      notifyAdminNewMember(memberName);
      toast({ title: "Welcome to BizMart Club! 🎉", description: "Your membership is now active." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleActivateSeller = async () => {
    if (!sellerCode.trim() || !user) return;
    setActivatingSeller(true);
    try {
      const { data: codeData } = await (supabase as any).from("seller_codes").select("*").eq("code", sellerCode.trim().toUpperCase()).eq("is_used", false).maybeSingle();
      if (!codeData) {
        toast({ title: "Invalid Seller Code", description: "This code is invalid or already used.", variant: "destructive" });
        setActivatingSeller(false);
        return;
      }
      if (sellerCount >= maxSellers) {
        toast({ title: "Slots Full", description: `Only ${maxSellers} seller slots available.`, variant: "destructive" });
        setActivatingSeller(false);
        return;
      }
      await (supabase as any).from("seller_codes").update({ is_used: true, used_by: user.id }).eq("id", codeData.id);
      if (membership) {
        await (supabase as any).from("club_memberships").update({ membership_type: "premium" }).eq("id", membership.id);
        setMembership({ ...membership, membership_type: "premium" });
      }
      const { data: sp } = await (supabase as any).from("seller_profiles").insert({
        user_id: user.id, store_name: `${profile?.first_name || "My"}'s Store`,
      }).select().single();
      setSellerProfile(sp);
      toast({ title: "Welcome, Seller! 🎉", description: "You are now a premium member & seller." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setActivatingSeller(false);
  };

  const handleSubmitApplication = async () => {
    if (!user || !appForm.full_name.trim() || !appForm.business_type.trim()) {
      toast({ title: "Missing Fields", description: "Please fill out all required fields.", variant: "destructive" });
      return;
    }
    setSubmittingApp(true);
    try {
      const { data, error } = await (supabase as any)
        .from("seller_applications")
        .insert({
          user_id: user.id,
          ...appForm,
          status: "pending"
        })
        .select()
        .single();
      
      if (error) throw error;
      setApplication(data);
      setShowApplication(false);
      toast({ title: "Application Submitted! ✅", description: "We will review your application soon." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmittingApp(false);
    }
  };

  const downloadId = async () => {
  if (!idRef.current) return;

  try {
    const { default: html2canvas } = await import("html2canvas");

    // 🔥 Target the name element (add this class in your JSX)
    const nameEl = idRef.current.querySelector(".card-holder-name");

    // 🔥 Save original styles
    const originalOverflow = idRef.current.style.overflow;

    // 🔥 Temporarily fix clipping issues
    if (nameEl) nameEl.classList.remove("truncate");
    idRef.current.style.overflow = "visible";

    const canvas = await html2canvas(idRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });

    // 🔥 Restore original styles
    if (nameEl) nameEl.classList.add("truncate");
    idRef.current.style.overflow = originalOverflow;

    const link = document.createElement("a");
    link.download = `BizMart-Card-${membership.control_number.replace(/\s/g, '-')}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

  } catch {
    toast({
      title: "Download failed",
      description: "Please take a screenshot instead.",
      variant: "destructive",
    });
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
    );
  }

  const isPremium = membership?.membership_type === "premium";

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />
      
      {/* ═══ Top Navigation Buttons ═══ */}
      <div className="sticky top-[52px] z-30 bg-background/80 backdrop-blur-md border-b border-border px-3 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          <button 
            onClick={() => setActiveTab("membership")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              activeTab === "membership" ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-muted text-muted-foreground"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" /> Membership
          </button>
          <button 
            onClick={() => setActiveTab("bcoins")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              activeTab === "bcoins" ? "bg-warning text-warning-foreground shadow-md shadow-warning/20" : "bg-muted text-muted-foreground"
            }`}
          >
            <Coins className="h-3.5 w-3.5" /> BCoins Wallet
          </button>
          <button 
            onClick={() => setActiveTab("seller")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              activeTab === "seller" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "bg-muted text-muted-foreground"
            }`}
          >
            <Store className="h-3.5 w-3.5" /> Become a Seller
          </button>
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* ═══ Membership Tab ═══ */}
        {activeTab === "membership" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            {!membership && !checkingMembership ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-black text-foreground">Join the Club! ✨</h1>
                  <p className="text-sm text-muted-foreground">Unlock exclusive student benefits at BizMart.</p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-accent rounded-2xl p-5 border border-primary/20">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Why register?</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5"><Zap className="h-3 w-3 text-primary" /></div>
                      <p className="text-xs text-muted-foreground"><strong className="text-foreground">Discount Card:</strong> Soon, use your digital ID to get discounts on orders ₱50 and above!</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5"><Coins className="h-3 w-3 text-primary" /></div>
                      <p className="text-xs text-muted-foreground"><strong className="text-foreground">Earn BCoins:</strong> Get rewards for every purchase and daily check-ins.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5"><Shield className="h-3 w-3 text-primary" /></div>
                      <p className="text-xs text-muted-foreground"><strong className="text-foreground">Full Access:</strong> Use all premium functions of the BizMart store app.</p>
                    </li>
                  </ul>
                </div>

                <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-bold text-sm">Enter Your Club Code</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Pay at the ABM store in school to get your exclusive code.</p>
                  <Input
                    placeholder="ENTER CODE HERE"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="mb-3 text-center font-black tracking-widest h-12"
                  />
                  <Button onClick={handleRedeemCode} disabled={loading || !code.trim()} className="w-full h-12 font-bold">
                    {loading ? "Verifying..." : "Activate Membership"}
                  </Button>
                </div>
              </div>
            ) : membership && (
              <div className="flex flex-col items-center space-y-8">
                {/* 💳 ATM Style ID Card */}
                <div
                                  ref={idRef}
                                  className="w-full max-w-[340px] aspect-[1.586/1] rounded-[20px] relative overflow-hidden shadow-2xl transition-transform active:scale-[0.98]"
                                  style={{
                                  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                }}
                >
                  {/* Gloss Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                  
                  {/* BizMart Logo Top Right */}
                  <div className="absolute top-4 right-5 flex items-center gap-2 opacity-90">
                    <img src={bizLogo} className="h-8 w-8 object-contain" alt="" />
                    <span className="text-white font-black text-sm tracking-tighter">BIZMART</span>
                  </div>

                  {/* Gold Chip */}
                  <div className="absolute top-12 left-6 w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 border border-black/10 overflow-hidden">
                    <div className="w-full h-full opacity-30" style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.2) 50%), linear-gradient(0deg, transparent 50%, rgba(0,0,0,0.2) 50%)', backgroundSize: '10px 10px' }} />
                  </div>

                  {/* Card Number (Control Number) */}
                  <div className="absolute top-[55%] left-6 right-6">
                    <p className="text-white text-xl font-mono tracking-[0.15em] drop-shadow-md">
                      {membership.control_number}
                    </p>
                  </div>

                  {/* Bottom Info Row */}
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-[8px] text-white/60 uppercase font-bold tracking-widest mb-0.5">Card Holder</p>
                      <p className="text-white text-sm font-bold uppercase truncate tracking-wide">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[8px] text-white/60 uppercase font-bold tracking-widest mb-0.5">Valid Thru</p>
                      <p className="text-white text-sm font-bold font-mono">
                        {new Date(membership.expiry_date).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Contactless / NFC Icon */}
                  <div className="absolute top-12 right-6 opacity-30 rotate-90">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => <div key={i} className="w-0.5 h-4 bg-white rounded-full" />)}
                    </div>
                  </div>

                  {/* Premium Badge */}
                  {isPremium && (
                    <div className="absolute top-4 left-6 px-2 py-0.5 bg-yellow-400/20 border border-yellow-400/40 rounded flex items-center gap-1">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">PREMIUM</span>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-4">
                  <Button onClick={downloadId} className="w-full h-12 rounded-xl gap-2 font-bold shadow-lg">
                    <Download className="h-4 w-4" /> Download Digital Card
                  </Button>
                  
                  <div className="bg-muted/50 rounded-2xl p-5 border border-border">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Future Updates</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your digital card will soon be your <strong className="text-foreground">Discount Card</strong>. 
                      Simply show your card at school to get special discounts on products and printing using your BCoins! 🚀
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ BCoins Tab ═══ */}
        {activeTab === "bcoins" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-gradient-to-br from-warning/20 to-primary/10 rounded-2xl p-6 border border-warning/20 text-center shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Available Balance</p>
              <p className="text-4xl font-black text-warning">{(Number(wallet?.balance || profile?.bcoins || 0)).toFixed(1)} 🪙</p>
              <Button 
                onClick={() => navigate("/bcoins")} 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-[10px] font-bold text-primary hover:bg-primary/5"
              >
                Go to Full Wallet <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <BCoinsFeatures activeSection={bcoinsSection} onSectionChange={setBcoinsSection} />
            
            {bcoinsSection === 'spin' && (
              <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-3">
                <Disc className="h-10 w-10 text-purple-500 mx-auto animate-spin-slow" />
                <h4 className="font-bold text-sm">Lucky Spin</h4>
                <p className="text-xs text-muted-foreground">Test your luck daily! Win up to 10 BCoins.</p>
                <Button onClick={() => navigate("/bcoins")} className="w-full rounded-xl">Open Spin Page</Button>
              </div>
            )}

            {bcoinsSection === 'store' && (
              <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-3">
                <Gift className="h-10 w-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm">BCoins Store</h4>
                <p className="text-xs text-muted-foreground">Redeem your coins for real GCash rewards.</p>
                <Button onClick={() => navigate("/bcoins")} className="w-full rounded-xl" variant="outline">Browse Store</Button>
              </div>
            )}
          </div>
        )}

        {/* ═══ Seller Tab ═══ */}
        {activeTab === "seller" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {sellerProfile ? (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 shadow-lg text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg">Active Seller</h3>
                      <p className="text-xs text-white/80">{sellerProfile.store_name}</p>
                    </div>
                  </div>
                  <Crown className="h-6 w-6 text-yellow-300 fill-yellow-300" />
                </div>
                <Button onClick={() => navigate("/seller-store")} className="w-full bg-white text-emerald-600 font-bold hover:bg-white/90 rounded-xl h-12">
                  Go to Management Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-5 w-5" />
                    <span className="font-black text-sm uppercase tracking-widest">Start Your Business</span>
                  </div>
                  <h2 className="text-xl font-black mb-2 leading-tight">Become a BizMart Seller!</h2>
                  <p className="text-white/80 text-xs mb-4">Run your own micro-business inside the campus and earn real money.</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <div className="bg-white/20 rounded-lg p-2 flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-white" /> Low Entry Fee
                    </div>
                    <div className="bg-white/20 rounded-lg p-2 flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-white" /> Real Earnings
                    </div>
                  </div>
                </div>

                {!application && !showApplication && (
                  <Button onClick={() => setShowApplication(true)} className="w-full h-14 rounded-2xl gap-2 font-black shadow-lg" variant="outline">
                    <FileText className="h-5 w-5 text-primary" />
                    FILL OUT APPLICATION FORM
                  </Button>
                )}

                {showApplication && (
                  <div className="bg-card rounded-2xl p-6 border border-border space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
                      <h3 className="font-black text-sm uppercase tracking-tight">Seller Application</h3>
                      <button onClick={() => setShowApplication(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Full Name</Label>
                        <Input value={appForm.full_name} onChange={(e) => setAppForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Juan Dela Cruz" className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Business Category</Label>
                        <Input value={appForm.business_type} onChange={(e) => setAppForm(f => ({ ...f, business_type: e.target.value }))} placeholder="e.g. Handmade Accessories" className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">What will you sell?</Label>
                        <Textarea value={appForm.products_to_sell} onChange={(e) => setAppForm(f => ({ ...f, products_to_sell: e.target.value }))} placeholder="List items..." rows={2} className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Motivation</Label>
                        <Textarea value={appForm.reason} onChange={(e) => setAppForm(f => ({ ...f, reason: e.target.value }))} placeholder="Why do you want to be a seller?" rows={2} className="rounded-xl" />
                      </div>
                    </div>
                    <Button onClick={handleSubmitApplication} disabled={submittingApp} className="w-full h-12 font-bold rounded-xl mt-4">
                      {submittingApp ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                )}

                {application && (
                  <div className="bg-card rounded-2xl p-5 border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-xs">Application Status</p>
                        <p className="text-[10px] text-muted-foreground">Currently under review</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-warning/20 text-warning uppercase">{application.status}</span>
                  </div>
                )}

                <div className="bg-muted/30 rounded-2xl p-5 border border-border border-dashed">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-warning" />
                    <span className="font-black text-sm uppercase tracking-tight">Have a Seller Code?</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-4 font-medium uppercase tracking-wider">Approved sellers enter code below</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="XXXX-XXXX"
                      value={sellerCode}
                      onChange={(e) => setSellerCode(e.target.value.toUpperCase())}
                      className="flex-1 text-center font-black tracking-[0.2em] h-12 rounded-xl"
                    />
                    <Button onClick={handleActivateSeller} disabled={activatingSeller || !sellerCode.trim()} className="h-12 w-12 p-0 rounded-xl">
                      {activatingSeller ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

// Minimal icons used locally
const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);
const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);