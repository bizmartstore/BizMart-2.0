"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Trash2, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { useAtmCards } from "@/hooks/useAtmCards";
import { toast } from "sonner";

interface AtmCardListProps {
  onCardUnlinked?: () => void;
}

export default function AtmCardList({ onCardUnlinked }: AtmCardListProps) {
  const { cards, loading, error, unlinkCard } = useAtmCards();
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const handleUnlink = async (cardId: string) => {
    setUnlinkingId(cardId);
    const success = await unlinkCard(cardId);
    if (success) {
      toast.success("ATM card unlinked successfully!");
      onCardUnlinked?.();
    } else {
      toast.error("Failed to unlink ATM card. Please try again.");
    }
    setUnlinkingId(null);
  };

  const copyCardNumber = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s+/g, "");
    navigator.clipboard.writeText(cleaned);
    toast.success("Card number copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (cards.length === 0) {
    return (
      <Card className="border border-border shadow-lg">
        <CardContent className="py-8 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <CardTitle className="text-sm font-bold mb-2">No ATM Cards Linked</CardTitle>
          <CardDescription className="text-xs">
            You haven't linked any ATM cards yet.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm font-bold">Linked ATM Cards</CardTitle>
        </div>
        <CardDescription>
          Manage your linked ATM cards for bCoins redemption
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-muted/30 rounded-lg p-4 border border-border/50 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {card.card_holder_name}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {card.card_number}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyCardNumber(card.card_number)}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleUnlink(card.id)}
                disabled={unlinkingId === card.id}
                className="h-8 gap-1"
              >
                {unlinkingId === card.id ? (
                  <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                Unlink
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}