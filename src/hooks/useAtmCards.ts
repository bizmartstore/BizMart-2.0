"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/integrations/supabase/types";

// ✅ Use Supabase generated type
type AtmCard = Database["public"]["Tables"]["user_atm_cards"]["Row"];

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
      const { data, error } = await supabase
        .from("user_atm_cards")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;

      // ✅ Fix "never" issue
      setCards((data as AtmCard[]) || []);
    } catch (err: any) {
      console.error("Failed to load ATM cards:", err);
      setError(err.message || "Failed to load ATM cards.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const linkCard = async (cardNumber: string, cardHolderName: string) => {
    if (!user) throw new Error("User not logged in");

    setLoading(true);
    try {
      // ✅ Use single() for proper typing
      const { data: wallet, error: walletError } = await supabase
        .from("bcoins_wallets")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (walletError) throw walletError;

      // Format card number
      const maskedCard = cardNumber
        .replace(/\s+/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim();

      const { error } = await supabase
        .from("user_atm_cards")
        .insert({
          user_id: user.id,
          card_number: maskedCard,
          card_holder_name: cardHolderName,
          bcoins_wallet_id: wallet.id,
        });

      if (error) throw error;

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
      const { error } = await supabase
        .from("user_atm_cards")
        .update({ is_active: false })
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