"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface AtmCard {
  id: string;
  user_id: string;
  card_number: string;
  card_holder_name: string;
  bcoins_wallet_id: string;
  is_active: boolean;
}

interface Wallet {
  id: string;
}

export const useAtmCards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<AtmCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCards = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Directly query for active cards
      const { data, error: fetchError } = await supabase
        .from("user_atm_cards")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (fetchError) throw fetchError;
      setCards(data || []);
    } catch (err: any) {
      console.error("Failed to load ATM cards:", err);
      setError(err.message || "Failed to load ATM cards. Please try again later.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const linkCard = async (cardNumber: string, cardHolderName: string) => {
    if (!user) throw new Error("User not logged in");
    setLoading(true);
    try {
      // Get user's bCoins wallet
      const { data: wallet } = await supabase
        .from("bcoins_wallets")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle() as { data: { id: string } | null };

      if (!wallet) {
        throw new Error("No bCoins wallet found. Please ensure you have a bCoins wallet.");
      }

      // Generate BZM-2026-XXXX format card number
      // Extract last 4 digits from the input card number
      const cleanedCard = cardNumber.replace(/\s+/g, "");
      const lastFourDigits = cleanedCard.slice(-4);
      const bzmCardNumber = `BZM-2026-${lastFourDigits}`;

      // Insert new ATM card
      const { error: insertError } = await supabase
        .from("user_atm_cards")
        .insert({
          user_id: user.id,
          card_number: bzmCardNumber,
          card_holder_name: cardHolderName,
          bcoins_wallet_id: wallet.id,
          is_active: true,
        } as never);

      if (insertError) throw insertError;

      await loadCards();
      return true;
    } catch (err: any) {
      console.error("Failed to link ATM card:", err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unlinkCard = async (cardId: string) => {
    if (!user) throw new Error("User not logged in");
    setLoading(true);
    try {
      // Update card to set is_active to false
      const { error } = await supabase
        .from("user_atm_cards")
        .update({
          is_active: false,
        } as never)
        .eq("id", cardId)
        .eq("user_id", user.id);

      if (error) throw error;

      await loadCards();
      return true;
    } catch (err: any) {
      console.error("Failed to unlink ATM card:", err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadCards();
  }, [user]);

  return { cards, loading, error, linkCard, unlinkCard, refresh: loadCards };
};