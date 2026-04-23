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
      toast.error("Failed to generate payment reference");
      return null;
    }

    return data as PaymentReference;
  } catch (error) {
    console.error(error);
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
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch references error:", error);
      return [];
    }

    return (data || []) as PaymentReference[];
  } catch (error) {
    console.error(error);
    return [];
  }
};

// ==========================
// VERIFY REFERENCE
// ==========================
const verifyPaymentReference = async (
  referenceCode: string
): Promise<PaymentReference | null> => {
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
    console.error(error);
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
      console.error(error);
      toast.error("Failed to update reference");
      return false;
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// ==========================
// REALTIME
// ==========================
const setupPaymentReferencesRealtime = (
  organizationId: string,
  callback: (ref: PaymentReference) => void
) => {
  return supabase
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
        callback(payload.new as PaymentReference);
      }
    )
    .subscribe();
};

export {
  generatePaymentReference,
  getPaymentReferencesForOrganization,
  verifyPaymentReference,
  markPaymentReferenceAsUsed,
  setupPaymentReferencesRealtime,
};