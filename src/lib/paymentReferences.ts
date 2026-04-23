// Payment References Service - Handles all payment reference operations with proper organization filtering

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentReference {
  id: string;
  organization_id: string;
  reference_code: string;
  amount: number;
  status: string;
  used: boolean;
  used_by?: string | null;
  used_at?: string | null;
  created_at: string;
  organizations?: {
    name: string;
  } | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

/**
 * Generate a truly safer unique reference code
 */
const generateUniqueCode = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${timestamp}${random}`;
};

/**
 * Generate a payment reference for a specific organization
 */
const generatePaymentReference = async (
  organizationId: string,
  amount: number = 50.0
): Promise<PaymentReference | null> => {
  try {
    const refNumber = generateUniqueCode();

    const { data: newRef, error } = await supabase
      .from("payment_references")
      .insert([
        {
          organization_id: organizationId,
          reference_code: refNumber,
          amount,
          used: false,
        },
      ])
      .select(`*, organizations:organization_id(name)`)
      .single();

    if (error) {
      console.error("Error generating payment reference:", error);
      toast.error("Failed to generate payment reference");
      return null;
    }

    return newRef as PaymentReference;
  } catch (error) {
    console.error("Error generating payment reference:", error);
    toast.error("Failed to generate payment reference");
    return null;
  }
};

/**
 * Get payment references for a specific organization
 */
const getPaymentReferencesForOrganization = async (
  organizationId: string
): Promise<PaymentReference[]> => {
  try {
    let query = supabase
      .from("payment_references")
      .select(`*, organizations:organization_id(name), profiles:used_by(first_name, last_name)`)
      .order("created_at", { ascending: false });

    if (organizationId?.trim()) {
      query = query.eq("organization_id", organizationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching payment references:", error);
      return [];
    }

    return (data || []) as PaymentReference[];
  } catch (error) {
    console.error("Error fetching payment references:", error);
    return [];
  }
};

/**
 * Mark payment reference as used
 */
const markPaymentReferenceAsUsed = async (
  referenceId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("payment_references")
      .update({
        used: true,
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq("id", referenceId);

    if (error) {
      console.error("Error marking payment reference as used:", error);
      toast.error("Failed to mark payment reference as used");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error marking payment reference as used:", error);
    toast.error("Failed to mark payment reference as used");
    return false;
  }
};

/**
 * Verify payment reference (FIXED CRITICAL BUG HERE)
 */
const verifyPaymentReference = async (
  referenceCode: string,
  organizationId: string
): Promise<PaymentReference | null> => {
  try {
    const cleanCode = referenceCode.trim().toUpperCase();

    const { data, error } = await supabase
      .from("payment_references")
      .select(`*, organizations:organization_id(name)`)
      .eq("reference_code", cleanCode)
      .eq("organization_id", organizationId)
      .eq("used", false)
      .maybeSingle();

    if (error) {
      console.error("Error verifying payment reference:", error);
      return null;
    }

    return data as PaymentReference | null;
  } catch (error) {
    console.error("Error verifying payment reference:", error);
    return null;
  }
};

/**
 * Realtime subscription (fixed safety check)
 */
const setupPaymentReferencesRealtime = (
  organizationId: string,
  callback: (newRef: PaymentReference) => void
) => {
  const channel = supabase
    .channel(`payment_references_${organizationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "payment_references",
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => {
        const newRef = payload.new as PaymentReference;

        if (newRef?.organization_id === organizationId) {
          callback(newRef);
        }
      }
    )
    .subscribe();

  return channel;
};

export {
  generatePaymentReference,
  getPaymentReferencesForOrganization,
  markPaymentReferenceAsUsed,
  verifyPaymentReference,
  setupPaymentReferencesRealtime,
};

export type { PaymentReference };