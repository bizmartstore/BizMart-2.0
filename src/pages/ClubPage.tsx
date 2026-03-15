import { useState, useEffect, useRef } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Download, Shield, Store, Sparkles, ArrowRight, FileText } from "lucide-react";
import { notifyAdminNewMember } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import bizLogo from "@/assets/bizmart-logo.png";
import { useNavigate } from "react-router-dom";

export default function ClubPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (user) {
      // Check membership
      (supabase as any)
        .from("club_memberships")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()
        .then(({ data }: any) => {
          setMembership(data);
          setCheckingMembership(false);
        });

      // Check seller profile
      (supabase as any)
        .from("seller_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }: any) => setSellerProfile(data));

      // Check existing application
      (supabase as any)
        .from("seller_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }: any) => setApplication(data));
    } else {
      setCheckingMembership(false);
    }

    // Get seller count and max
    (supabase as any)
      .from("seller_profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .then(({ count }: any) => setSellerCount(count || 0));

    (supabase as any)
      .from("app_settings")
      .select("*")
      .eq("key", "max_sellers")
      .maybeSingle()
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
        .select()
        .single();

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
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSubmittingApp(false);
  };

  const handleActivateSeller = async () => {
    if (!sellerCode.trim() || !user) return;
    setActivatingSeller(true);
    try {
      // Check seller code
      const { data: codeData, error: codeError } = await (supabase as any)
        .from("seller_codes")
        .select("*")
        .eq("code", sellerCode.trim().toUpperCase())
        .eq("is_used", false)
        .maybeSingle();

      if (codeError || !codeData) {
        toast({ title: "Invalid Seller Code", description: "This code is invalid or already used.", variant: "destructive" });
        setActivatingSeller(false);
        return;
      }

      if (sellerCount >= maxSellers) {
        toast({ title: "Slots Full", description: `Only ${maxSellers} seller slots available. Please try again later.`, variant: "destructive" });
        setActivatingSeller(false);
        return;
      }

      // Mark code as used
      await (supabase as any).from("seller_codes").update({ is_used: true, used_by: user.id }).eq("id", codeData.id);

      // Upgrade membership
      if (membership) {
        await (supabase as any).from("club_memberships").update({ membership_type: "premium" }).eq("id", membership.id);
        setMembership({ ...membership, membership_type: "premium" });
      }

      // Create seller profile
      const { data: sp, error: spError } = await (supabase as any).from("seller_profiles").insert({
        user_id: user.id,
        store_name: `${profile?.first_name || "My"}'s Store`,
      }).select().single();

      if (spError) throw spError;
      setSellerProfile(sp);
      toast({ title: "Welcome, Seller! 🎉", description: "You are now a premium member & seller. Set up your store!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setActivatingSeller(false);
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
    );
  }

  const isPremium = membership?.membership_type === "premium";

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-6 w-6 text-warning" />
          <h1 className="font-extrabold text-lg">BizMart Club</h1>
          {isPremium && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              ⭐ PREMIUM
            </span>
          )}
        </div>

        {/* No membership yet */}
        {!membership && !checkingMembership && (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">Enter Your Club Code</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Pay at the ABM store in school to get your exclusive club code. Enter it below to activate your membership.
            </p>
            <Input
              placeholder="Enter code (e.g. BIZCLUB2026)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="mb-3 text-center font-bold tracking-widest"
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
              <div
                ref={idRef}
                className="w-[320px] rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%)' }}
              >
                {/* Header with pattern overlay */}
                <div className="relative px-5 pt-5 pb-3">
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #e94560, transparent)' }} />
                  <div className="absolute top-8 right-12 w-16 h-16 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #f7d716, transparent)' }} />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <img src={bizLogo} alt="BizMart" className="h-12 w-12 rounded-xl shadow-lg" style={{ background: 'rgba(255,255,255,0.15)', padding: '4px' }} />
                    <div>
                      <div className="font-extrabold text-base tracking-wide" style={{ color: '#f7d716' }}>BIZMART CLUB</div>
                      <div className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {isPremium ? "⭐ PREMIUM SELLER MEMBER" : "OFFICIAL MEMBER ID"}
                      </div>
                    </div>
                  </div>
                  {/* Gold accent line */}
                  <div className="mt-3 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, #f7d716, #e94560, #f7d716)' }} />
                </div>

                {/* Photo + Info Section */}
                <div className="px-5 py-3 flex gap-4 items-start">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    <div className="h-[90px] w-[72px] rounded-xl overflow-hidden shadow-lg" style={{ border: '2px solid rgba(247,215,22,0.5)', background: 'rgba(255,255,255,0.1)' }}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-4xl">👤</span>
                        </div>
                      )}
                    </div>
                    {isPremium && (
                      <div className="mt-1.5 text-center text-[8px] font-extrabold py-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #f7d716, #ff9a00)', color: '#1a1a2e' }}>
                        ⭐ PREMIUM
                      </div>
                    )}
                  </div>

                  {/* Name & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm leading-tight" style={{ color: '#ffffff' }}>
                      {profile?.first_name} {profile?.last_name}
                    </div>
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{profile?.email}</div>
                    
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">🏫</span>
                        <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{profile?.school || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">🎓</span>
                        <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{profile?.grade_level} - {profile?.section}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates Row */}
                <div className="px-5 pb-2">
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Member Since</div>
                      <div className="text-[11px] font-extrabold" style={{ color: '#f7d716' }}>{new Date(membership.membership_date).toLocaleDateString()}</div>
                    </div>
                    <div className="flex-1 rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Valid Until</div>
                      <div className="text-[11px] font-extrabold" style={{ color: '#e94560' }}>{new Date(membership.expiry_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                {/* Control Number Footer */}
                <div className="px-5 pb-4 pt-1">
                  <div className="rounded-xl p-2.5 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(247,215,22,0.15), rgba(233,69,96,0.15))' }}>
                    <div className="text-[8px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.5)' }}>Control Number</div>
                    <div className="font-extrabold text-base tracking-[0.2em] mt-0.5" style={{ color: '#f7d716' }}>{membership.control_number}</div>
                  </div>
                </div>

                {/* Bottom accent */}
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #f7d716, #e94560, #f7d716)' }} />
              </div>

              <Button onClick={downloadId} className="mt-4 gap-2">
                <Download className="h-4 w-4" />
                Download ID Card
              </Button>
            </div>

            {/* Seller Section - Only for standard members without seller profile */}
            {!isPremium && !sellerProfile && (
              <div className="mt-6 space-y-3">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-5 w-5 text-white" />
                    <span className="font-extrabold text-white text-sm">Become a Seller!</span>
                  </div>
                  <p className="text-white/80 text-xs mb-2">
                    Upgrade to Premium Membership for just ₱50.00 and start selling on BizMart!
                  </p>
                  <div className="bg-white/20 rounded-xl p-3 text-white text-[11px] space-y-1 mb-3">
                    <p>📍 <strong>Step 1:</strong> Fill out the seller application form below</p>
                    <p>🏫 <strong>Step 2:</strong> Visit the BizMart store at school with ₱50.00</p>
                    <p>📝 <strong>Step 3:</strong> Submit your application to the Manager</p>
                    <p>🔑 <strong>Step 4:</strong> Receive your Seller Code once approved</p>
                    <p>✅ <strong>Step 5:</strong> Enter seller code below to activate!</p>
                  </div>
                  <p className="text-white/60 text-[10px]">
                    Slots available: {Math.max(0, maxSellers - sellerCount)} of {maxSellers}
                  </p>
                </div>

                {/* Application Form or Status */}
                {!application && !showApplication && (
                  <Button onClick={() => setShowApplication(true)} className="w-full gap-2" variant="outline">
                    <FileText className="h-4 w-4" />
                    Fill Out Seller Application Form
                  </Button>
                )}

                {showApplication && (
                  <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
                    <h3 className="font-bold text-sm">📝 Seller Application Form</h3>
                    <div>
                      <Label className="text-xs">Full Name *</Label>
                      <Input value={appForm.full_name} onChange={(e) => setAppForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">What type of business do you want to run? *</Label>
                      <Input value={appForm.business_type} onChange={(e) => setAppForm(f => ({ ...f, business_type: e.target.value }))} placeholder="e.g. School Supplies, Snacks, Accessories" className="text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">What products will you sell? *</Label>
                      <Textarea value={appForm.products_to_sell} onChange={(e) => setAppForm(f => ({ ...f, products_to_sell: e.target.value }))} placeholder="List the products you plan to sell" className="text-sm" rows={2} />
                    </div>
                    <div>
                      <Label className="text-xs">Why do you want to be a seller? *</Label>
                      <Textarea value={appForm.reason} onChange={(e) => setAppForm(f => ({ ...f, reason: e.target.value }))} placeholder="Tell us your motivation" className="text-sm" rows={2} />
                    </div>
                    <div>
                      <Label className="text-xs">Any selling experience? (optional)</Label>
                      <Input value={appForm.experience} onChange={(e) => setAppForm(f => ({ ...f, experience: e.target.value }))} placeholder="e.g. Sold items at school before" className="text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setShowApplication(false)} variant="outline" className="flex-1">Cancel</Button>
                      <Button onClick={handleSubmitApplication} disabled={submittingApp} className="flex-1">
                        {submittingApp ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </div>
                )}

                {application && (
                  <div className="bg-card rounded-2xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">Application Status</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        application.status === "approved" ? "bg-green-100 text-green-600" :
                        application.status === "rejected" ? "bg-red-100 text-red-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {application.status.toUpperCase()}
                      </span>
                    </div>
                    {application.status === "approved" && (
                      <p className="text-xs text-muted-foreground mb-2">
                        🎉 Your application was approved! Visit the store to pay ₱50.00 and get your Seller Code.
                      </p>
                    )}
                    {application.status === "pending" && (
                      <p className="text-xs text-muted-foreground">
                        ⏳ Your application is being reviewed. Visit the BizMart store to complete the process.
                      </p>
                    )}
                    {application.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-1">Admin note: {application.admin_notes}</p>
                    )}
                  </div>
                )}

                {/* Seller Code Input */}
                <div className="bg-card rounded-2xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-warning" />
                    <span className="font-bold text-sm">Have a Seller Code?</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Enter the seller code given by the admin after approval & ₱50.00 payment.
                  </p>
                  <Input
                    placeholder="Enter Seller Code"
                    value={sellerCode}
                    onChange={(e) => setSellerCode(e.target.value.toUpperCase())}
                    className="mb-3 text-center font-bold tracking-widest"
                  />
                  <Button onClick={handleActivateSeller} disabled={activatingSeller || !sellerCode.trim()} className="w-full">
                    {activatingSeller ? "Activating..." : "Activate Seller Account"}
                  </Button>
                </div>
              </div>
            )}

            {/* Seller already active - Go to store */}
            {sellerProfile && (
              <div className="mt-6">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Store className="h-5 w-5 text-white" />
                        <span className="font-extrabold text-white text-sm">Your Seller Store</span>
                      </div>
                      <p className="text-white/80 text-xs">{sellerProfile.store_name || "Set up your store"}</p>
                    </div>
                    <Button
                      onClick={() => navigate("/seller-store")}
                      className="bg-white text-emerald-600 font-bold hover:bg-white/90"
                      size="sm"
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
