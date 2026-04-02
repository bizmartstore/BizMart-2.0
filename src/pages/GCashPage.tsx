import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notifyAdminGCash, notifyCustomerBCoins } from "@/lib/notifications";

const GCASH_ADMIN_NUMBER = "09957656049";
const ALLOWED_AMOUNTS = [100, 150, 200, 250, 300, 350, 400, 450, 500];

type TransactionType = "cash_in" | "cash_out";

const statusIcon = {
  pending: <Clock className="h-4 w-4 text-warning" />,
  completed: <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />,
  rejected: <XCircle className="h-4 w-4 text-destructive" />,
};

export default function GCashPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { gcashFee } = useAppSettings();
  const [type, setType] = useState<TransactionType>("cash_in");
  const [amount, setAmount] = useState<number | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (user) {
      (supabase as any)
        .from("gcash_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }: any) => setTransactions(data || []));
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!amount || !gcashNumber.trim() || !user) return;
    if (gcashNumber.length !== 11) {
      toast({ title: "Invalid Number", description: "Enter a valid 11-digit GCash number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const refNo = `GC-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await (supabase as any)
        .from("gcash_transactions")
        .insert({
          user_id: user.id,
          type,
          amount,
          service_fee: gcashFee,
          total: amount + gcashFee,
          gcash_number: gcashNumber,
          admin_gcash_number: GCASH_ADMIN_NUMBER,
          reference_number: refNo,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      setTransactions((prev) => [data, ...prev]);

      const userName = `User ${user.email?.split("@")[0] || "Student"}`;
      notifyAdminGCash(type, userName, amount);
      notifyCustomerBCoins(user.id, 1, "GCash transaction");

      toast({
        title: "Request Submitted! ✅",
        description: `Ref: ${refNo}. Send ₱${amount + gcashFee} to ${GCASH_ADMIN_NUMBER} (incl. ₱${gcashFee} fee). +1 BCoin earned!`,
      });
      setShowForm(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Smartphone className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">GCash Transactions</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to access GCash services.</p>
          <Button onClick={() => window.location.href = "/login"}>Login</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="h-6 w-6 text-primary" />
          <h1 className="font-extrabold text-lg">GCash</h1>
        </div>

        {showForm && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
            <div>
              <label className="text-xs font-bold mb-1.5 block">Transaction Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setType("cash_in")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${type === "cash_in" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  <ArrowDownCircle className="h-4 w-4 inline mr-1" /> Cash In
                </button>
                <button
                  onClick={() => setType("cash_out")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${type === "cash_out" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  <ArrowUpCircle className="h-4 w-4 inline mr-1" /> Cash Out
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block">Amount (₱)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {ALLOWED_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${amount === a ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    ₱{a}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Or enter custom amount"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value) || null)}
                className="mt-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block">GCash Number</label>
              <Input
                type="tel"
                placeholder="09XXXXXXXXX"
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="text-sm"
              />
            </div>

            <div className="bg-muted/30 rounded-xl p-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-bold">₱{gcashFee}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span>Total to Pay</span>
                <span className="text-primary">₱{(amount ? amount + gcashFee : 0).toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={loading || !amount || !gcashNumber} className="w-full h-11 font-bold rounded-xl">
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-bold text-sm mb-3">Transaction History</h3>
          {transactions.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {tx.type === "cash_in" ? (
                        <ArrowDownCircle className="h-4 w-4 text-[hsl(var(--success))]" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-xs font-bold capitalize">{tx.type.replace("_", " ")}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.status === "completed" ? "bg-green-100 text-green-600" : tx.status === "rejected" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₱{Number(tx.amount).toFixed(2)} + ₱{Number(tx.service_fee).toFixed(2)} fee</span>
                    <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                  </div>
                  {tx.reference_number && (
                    <p className="text-[10px] text-muted-foreground mt-1">Ref: {tx.reference_number}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}