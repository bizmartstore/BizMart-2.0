import { Coins, Gift, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import { notifyAdminRedemption } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BCoinsPage() {
  const { user, profile } = useAuth();
  const [bcoins, setBcoins] = useState(0);
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastId, setToastId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
      const { data } = await supabase
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      setBcoins(data?.balance || 0);
    };
    fetchBalance();
  }, [user]);

  const handleRedeem = async () => {
    if (!user) return;
    const amount = parseFloat(redemptionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > bcoins) {
      toast.error("Insufficient BCoins balance");
      return;
    }

    setIsProcessing(true);
    try {
      // Update BCoins balance
      const { error } = await supabase
        .from("bcoins_wallets")
        .update({ balance: bcoins - amount })
        .eq("user_id", user.id);

      if (error) throw error;

      // Notify admin
      await notifyAdminRedemption(
        profile ? `${profile.first_name} ${profile.last_name}` : "User",
        amount
      );

      // Show success toast
      const id = toast.success(`Successfully redeemed ₱${amount.toFixed(2)}!`);
      setToastId(id);

      // Reset form
      setRedemptionAmount("");
    } catch (error: any) {
      toast.error(`Redemption failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-20">
        <Coins className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">Please log in to view your BCoins</p>
        <Button onClick={() => window.location.href = "/login"}>Log In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-sm ml-2">My BCoins</span>
      </div>

      <div className="px-4 pt-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">{bcoins}</p>
                <p className="text-sm text-muted-foreground">BCoins Balance</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="h-10"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>

          <div className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <h3 className="text-lg font-bold mb-3">Redeem BCoins</h3>
              <p className="text-sm text-muted-foreground">
                100 BCoins = ₱1. Redeem your BCoins for GCash or other rewards.
              </p>
              <div className="space-y-4">
                <Label htmlFor="amount" className="text-xs font-bold">Amount to Redeem (₱)</Label>
                <div className="flex items-center">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount in pesos"
                    value={redemptionAmount}
                    onChange={(e) => setRedemptionAmount(e.target.value)}
                    required
                  />
                  <span className="ml-2 text-sm font-semibold">₱</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum: ₱{(bcoins / 100).toFixed(2)}
                </p>
                <Button
                  onClick={handleRedeem}
                  disabled={isProcessing || redemptionAmount === ""}
                  className="w-full"
                >
                  {isProcessing ? "Processing..." : "Redeem Now"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}