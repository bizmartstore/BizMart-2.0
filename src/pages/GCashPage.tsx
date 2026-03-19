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
  const { gcacheFee } = useAppSettings(); // Fixed: use gcacheFee from useAppSettings
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
          service_fee: gcacheFee, // Fixed: use gcacheFee instead of gcashFee
          total: amount + gcacheFee,
          gcash_number: gcashNumber,
          admin_gcash_number: GCASH_ADMIN_NUMBER,
          reference_number: refNo,          status: "pending",
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
        description: `Ref: ${refNo}. Send ₱${amount + gcacheFee} to ${GCASH_ADMIN_NUMBER} (incl. ₱${gcacheFee} fee). +1 BCoin earned!`,
      });      setShowForm(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ... rest unchanged