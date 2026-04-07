// ... existing imports ...
import { validatePhoneNumber, validateNumber } from "@/lib/validation";

// ... existing code ...

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