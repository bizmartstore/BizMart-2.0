import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateNumber, validatePhoneNumber } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function GCashPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(0);
  const [gcashNumber, setGcashNumber] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!amount || !gcashNumber.trim() || !user) return;
    
    // Validate GCash number
    if (!validatePhoneNumber(gcashNumber)) {
      toast({ title: "Invalid Number", description: "Enter a valid 11-digit GCash number starting with 09.", variant: "destructive" });
      return;
    }
    
    // Validate amount
    const amountValidation = validateNumber(amount, 100, 10000);
    if (!amountValidation.valid) {
      toast({ title: "Invalid Amount", description: amountValidation.error || "Amount must be between ₱100 and ₱10,000", variant: "destructive" });
      return;
    }
      setLoading(true);
    try {
      // ... existing code ...
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... component JSX ...
  );
}