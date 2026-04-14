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
      // First check if the table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from("user_atm_cards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", "nonexistent")
        .limit(1);

      if (tableError && tableError.code === '42P01') {
        // Table doesn't exist
        setCards([]);
        setLoading(false);
        return;
      }

      if (tableError) {
        console.error("Table check error:", tableError);
        throw tableError;
      }

      // Table exists, proceed with normal query
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
        .maybeSingle();

      if (!wallet) {
        throw new Error("No bCoins wallet found. Please ensure you have a bCoins wallet.");
      }

      // Format card number with spaces
      const maskedCard = cardNumber.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();

      // Insert new ATM card - use proper Supabase types
      const { error: insertError } = await supabase
        .from("user_atm_cards")
        .insert({
          user_id: user.id,
          card_number: maskedCard,
          card_holder_name: cardHolderName,
          bcoins_wallet_id: wallet.id,
          is_active: true,
        });

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
        })
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