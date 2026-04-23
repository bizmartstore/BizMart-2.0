import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PaymentReference {
  id: string;
  organization_id: string;
  reference_code: string;
  amount: number;
  status: string;
  used: boolean;
  used_by?: string | null;
  used_at?: string | null;
  created_at: string;
}

// ==========================
// GENERATE PAYMENT REFERENCE
// ==========================
const generatePaymentReference = async (
  organizationId: string,
  amount: number = 50.0
): Promise<PaymentReference | null> => {
  if (!organizationId) {
    toast.error("Invalid organization ID");
    return null;
  }

  try {
    const refNumber = Math.floor(100000 + Math.random() * 900000).toString();

    const { data, error } = await supabase
      .from("payment_references")
      .insert([
        {
          organization_id: organizationId,
          reference_code: refNumber,
          amount,
          used: false,
          status: "active",
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Generate reference error:", error);
      toast.error(error.message || "Failed to generate payment reference");
      return null;
    }

    return data as PaymentReference;
  } catch (error) {
    console.error("Unexpected error:", error);
    toast.error("Failed to generate payment reference");
    return null;
  }
};

// ==========================
// GET REFERENCES
// ==========================
const getPaymentReferencesForOrganization = async (
  organizationId: string
): Promise<PaymentReference[]> => {
  try {
    let query = supabase
      .from("payment_references")
      .select("*")
      .order("created_at", { ascending: false });

    if (organizationId?.trim()) {
      query = query.eq("organization_id", organizationId);
    } else {
      console.warn("No organizationId provided to fetch payment references");
      return [];
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch references error:", error);
      return [];
    }

    return (data ?? []) as PaymentReference[];
  } catch (error) {
    console.error("Unexpected fetch error:", error);
    return [];
  }
};

// ==========================
// VERIFY REFERENCE
// ==========================
const verifyPaymentReference = async (
  referenceCode: string
): Promise<PaymentReference | null> => {
  if (!referenceCode?.trim()) return null;

  try {
    const { data, error } = await supabase
      .from("payment_references")
      .select("*")
      .eq("reference_code", referenceCode)
      .eq("used", false)
      .maybeSingle();

    if (error) {
      console.error("Verify error:", error);
      return null;
    }

    return data as PaymentReference;
  } catch (error) {
    console.error("Unexpected verify error:", error);
    return null;
  }
};

// ==========================
// MARK AS USED
// ==========================
const markPaymentReferenceAsUsed = async (
  referenceId: string,
  userId: string
): Promise<boolean> => {
  if (!referenceId || !userId) return false;

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
      console.error("Mark used error:", error);
      toast.error(error.message || "Failed to update reference");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected update error:", error);
    return false;
  }
};

// ==========================
// REALTIME (FIXED)
// ==========================
const setupPaymentReferencesRealtime = (
  organizationId: string,
  callback: (ref: PaymentReference) => void
) => {
  if (!organizationId) {
    console.warn("No organizationId provided for realtime");
    return null;
  }

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
        if (payload?.new) {
          callback(payload.new as PaymentReference);
        }
      }
    )
    .subscribe();

  return channel;
};

export {
  generatePaymentReference,
  getPaymentReferencesForOrganization,
  verifyPaymentReference,
  markPaymentReferenceAsUsed,
  setupPaymentReferencesRealtime,
};