import { Input } from "@/components/ui/input";
import { notifyAdminGCash, notifyCustomerBCoins } from "@/lib/notifications";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function GCashPage() {
  const { user, profile } = useAuth();
  const [gcashBalance, setGcashBalance] = useState(0);
  const [cashInAmount, setCashInAmount] = useState("");
  const [cashOutAmount, setCashOutAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"cashIn" | "cashOut">("cashIn");

  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
      const { data } = await supabase
        .from("gcash_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      setGcashBalance(data?.balance || 0);
    };
    fetchBalance();
  }, [user]);

  const handleCashIn = async () => {
    if (!user) return;
    const amount = parseFloat(cashInAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);
    try {
      // Update GCash balance
      const { error } = await supabase
        .from("gcash_wallets")
        .update({ balance: gcashBalance + amount })
        .eq("user_id", user.id);

      if (error) throw error;

      // Notify admin
      await notifyAdminGCash("Cash In", amount);

      // Show success toast      toast.success(`Successfully cashed in ₱${amount.toFixed(2)}!`);

      // Reset form
      setCashInAmount("");
    } catch (error: any) {
      toast.error(`Cash in failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashOut = async () => {
    if (!user) return;
    const amount = parseFloat(cashOutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > gcashBalance) {
      toast.error("Insufficient GCash balance");
      return;
    }

    setIsProcessing(true);
    try {
      // Update GCash balance
      const { error } = await supabase
        .from("gcash_wallets")
        .update({ balance: gcashBalance - amount })
        .eq("user_id", user.id);

      if (error) throw error;

      // Notify admin
      await notifyAdminGCash("Cash Out", amount);

      // Show success toast
      toast.success(`Successfully cashed out ₱${amount.toFixed(2)}!`);

      // Reset form
      setCashOutAmount("");
    } catch (error: any) {
      toast.error(`Cash out failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-20">
        <Smartphone className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">Please log in to use GCash</p>
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
        <span className="font-bold text-sm ml-2">GCash Wallet</span>
      </div>

      <div className="px-4 pt-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">₱{gcashBalance.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">GCash Balance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setActiveTab("cashIn")}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  activeTab === "cashIn"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Cash In
              </Button>
              <Button
                onClick={() => setActiveTab("cashOut")}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  activeTab === "cashOut"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Cash Out
              </Button>
            </div>
          </div>

          {activeTab === "cashIn" && (
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <h3 className="text-lg font-bold mb-3">Cash In</h3>
              <p className="text-sm text-muted-foreground">
                Add money to your GCash wallet from your bank or other sources.
              </p>
              <div className="space-y-4">
                <Label htmlFor="amount" className="text-xs font-bold">Amount (₱)</Label>
                <div className="flex items-center">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount in pesos"
                    value={cashInAmount}
                    onChange={(e) => setCashInAmount(e.target.value)}
                    required
                  />
                  <span className="ml-2 text-sm font-semibold">₱</span>
                </div>
                <Button
                  onClick={handleCashIn}
                  disabled={isProcessing || cashInAmount === ""}
                  className="w-full"
                >
                  {isProcessing ? "Processing..." : "Cash In"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "cashOut" && (
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <h3 className="text-lg font-bold mb-3">Cash Out</h3>
              <p className="text-sm text-muted-foreground">
                Withdraw money from your GCash wallet to your bank or other sources.
              </p>
              <div className="space-y-4">
                <Label htmlFor="amount" className="text-xs font-bold">Amount (₱)</Label>
                <div className="flex items-center">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount in pesos"
                    value={cashOutAmount}
                    onChange={(e) => setCashOutAmount(e.target.value)}
                    required
                  />
                  <span className="ml-2 text-sm font-semibold">₱</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum: ₱{gcashBalance.toFixed(2)}
                </p>
                <Button
                  onClick={handleCashOut}
                  disabled={isProcessing || cashOutAmount === ""}
                  className="w-full"
                >
                  {isProcessing ? "Processing..." : "Cash Out"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}