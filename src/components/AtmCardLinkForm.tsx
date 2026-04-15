"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, CreditCard, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAtmCards } from "@/hooks/useAtmCards";
import { toast } from "sonner";

interface AtmCardLinkFormProps {
  onSuccess?: () => void;
}

export default function AtmCardLinkForm({ onSuccess }: AtmCardLinkFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { linkCard, loading, error } = useAtmCards();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate card number (accept last 4 digits for BZM-2026-XXXX format)
    const cleanedCard = cardNumber.replace(/\s+/g, "");
    if (cleanedCard.length !== 4) {
      toast.error("Please enter the last 4 digits of your digital card ID");
      return;
    }

    // Validate card holder name
    if (!cardHolderName.trim()) {
      toast.error("Please enter the card holder's name");
      return;
    }

    const success = await linkCard(cleanedCard, cardHolderName.trim());

    if (success) {
      toast.success("ATM card linked successfully!");
      setCardNumber("");
      setCardHolderName("");
      onSuccess?.();
    } else {
      toast.error("Failed to link ATM card. Please try again.");
    }
  };

  return (
    <Card className="border border-border shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm font-bold">Link ATM Card</CardTitle>
        </div>
        <CardDescription>
          Link your ATM card to your bCoins wallet for easy redemption.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber" className="text-xs font-bold">
              ATM Card Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="BZM-2026-XXXX"
              value={cardNumber}
              onChange={(e) => {
                // Only allow digits and limit to 4 characters
                const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                setCardNumber(value);
              }}
              className="h-10 rounded-xl font-mono text-sm"
              required
            />
            <p className="text-[10px] text-muted-foreground">
              Enter your BZM-2026-XXXX digital card number (last 4 digits)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardHolderName" className="text-xs font-bold">
              Card Holder Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cardHolderName"
              type="text"
              placeholder="Juan Dela Cruz"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
              className="h-10 rounded-xl"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 font-bold rounded-xl gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Link ATM Card
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}