"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAtmCards } from "@/hooks/useAtmCards";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Coins, CreditCard, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import AtmCardLinkForm from "@/components/AtmCardLinkForm";
import AtmCardList from "@/components/AtmCardList";
import { supabase } from "@/integrations/supabase/client";


const REDEEM_OPTIONS = [
  { gcash: 50, bcoins: 500 },
  { gcash: 100, bcoins: 1000 },
  { gcash: 200, bcoins: 2000 },
  { gcash: 500, bcoins: 5000 },
];

export default function BCoinsRedeemPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { cards, loading: cardsLoading } = useAtmCards();
  const [selectedRedeem, setSelectedRedeem] = useState<number | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to redeem BCoins");
      navigate("/login");
    }
  }, [user, navigate]);

  const handleRedeem = async () => {
    if (!selectedRedeem || !gcashNumber.trim() || !user) return;
    const option = REDEEM_OPTIONS.find((o) => o.gcash === selectedRedeem);
    if (!option) return;

    if (gcashNumber.length !== 11) {
      toast.error("Enter a valid 11-digit GCash number");
      return;
    }

    if (cards.length === 0) {
      toast.error("Please link an ATM card first");
      setShowLinkForm(true);
      return;
    }

    setRedeeming(true);
    try {
      const walletBalance = Number(profile?.bcoins || 0);
      if (walletBalance < option.bcoins) {
        toast.error(`You need ${option.bcoins} BCoins`);
        return;
      }

      // Find the first active ATM card
      const activeCard = cards.find(card => card.is_active);
      if (!activeCard) {
        toast.error("No active ATM card found");
        return;
      }

      // Create redemption request
      const { error } = await supabase
        .from("bcoins_redemptions")
        .insert({
          user_id: user.id,
          bcoins_amount: option.bcoins,
          gcash_amount: option.gcash,
          gcash_number: gcashNumber,
          status: "pending",
          atm_card_id: activeCard.id,
        } as never);

      if (error) throw error;

      // Deduct BCoins from wallet
      const newBalance = walletBalance - option.bcoins;
      await supabase
        .from("bcoins_wallets")
        .update({
          balance: newBalance,
        } as never)
        .eq("user_id", user.id);

      // Add transaction record
      await supabase
        .from("bcoins_transactions")
        .insert({
          user_id: user.id,
          amount: -option.bcoins,
          type: "redeem_gcash",
          description: `Redeemed ₱${option.gcash} GCash to ${gcashNumber}`,
        } as never);

      toast.success(`Redemption submitted! ₱${option.gcash} GCash will be sent after admin approval.`);
      setSelectedRedeem(null);
      setGcashNumber("");
      refreshProfile();
    } catch (error: any) {
      toast.error("Failed to submit redemption: " + error.message);
    } finally {
      setRedeeming(false);
    }
  };

  const copyGcashNumber = () => {
    navigator.clipboard.writeText(gcashNumber);
    toast.success("GCash number copied!");
  };

  if (!user) {
    return null; // Handled by useEffect
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate(-1)} className="p-1.5">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Redeem BCoins</h1>
            <p className="text-xs text-muted-foreground">Convert your BCoins to GCash</p>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="border border-border shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-warning" />
              <CardTitle className="text-sm font-bold">Available Balance</CardTitle>
            </div>
            <CardDescription>
              Your current BCoins balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-warning">
              {Number(profile?.bcoins || 0).toFixed(1)} 🪙
            </p>
          </CardContent>
        </Card>

        {/* ATM Cards Section */}
        <Card className="border border-border shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-bold">ATM Cards</CardTitle>
            </div>
            <CardDescription>
              Link your ATM card for GCash redemption
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showLinkForm ? (
              <AtmCardLinkForm onSuccess={() => setShowLinkForm(false)} />
            ) : (
              <>
                <AtmCardList onCardUnlinked={() => {}} />
                <Button
                  onClick={() => setShowLinkForm(true)}
                  variant="outline"
                  className="w-full mt-3 h-10 font-bold rounded-xl gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Link New ATM Card
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Redeem Options */}
        <Card className="border border-border shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-sm font-bold">Select Redemption Amount</CardTitle>
            </div>
            <CardDescription>
              Choose how much GCash you want to redeem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {REDEEM_OPTIONS.map((opt) => (
                <button
                  key={opt.gcash}
                  onClick={() => setSelectedRedeem(opt.gcash)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    selectedRedeem === opt.gcash
                      ? "border-emerald-500 bg-emerald-500/10 shadow-inner"
                      : "border-border bg-card shadow-sm active:scale-95"
                  }`}
                >
                  <p className="font-black text-lg text-foreground">₱{opt.gcash}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
                    {opt.bcoins} BCoins
                  </p>
                </button>
              ))}
            </div>

            {selectedRedeem && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground ml-1">
                    GCash Number
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="09XXXXXXXXX"
                      value={gcashNumber}
                      onChange={(e) =>
                        setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
                      }
                      className="flex-1 h-12 rounded-xl text-base font-bold tracking-widest"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyGcashNumber}
                      className="h-12 w-12"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleRedeem}
                  disabled={redeeming || gcashNumber.length !== 11}
                  className="w-full h-14 font-black text-lg rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
                >
                  {redeeming ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Redeem ₱{selectedRedeem} GCash
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}