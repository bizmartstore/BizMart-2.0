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

    // Validate card number (16 digits)
    const cleanedCard = cardNumber.replace(/\s+/g, "");
    if (cleanedCard.length !== 16) {
      toast.error("Please enter a valid 16-digit card number");
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
                // Auto-format card number with spaces
                const value = e.target.value.replace(/\s+/g, "");
                if (value.length <= 16) {
                  const formatted = value.replace(/(.{4})/g, "$1 ").trim();
                  setCardNumber(formatted);
                }
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