// Database setup and migration helper functions
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Setup payment references table for organization join requests
export async function setupPaymentReferencesTable() {
  try {
    // Check if table exists
    const { data: tableCheck, error: checkError } = await supabase
      .from("payment_references" as any)
      .select("id", { count: "exact" })
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking payment_references table:", checkError);
      return;
    }

    // If table doesn't exist, create it
    if (checkError?.code === 'PGRST116') {
      const { error: createError } = await supabase
        .from("payment_references" as any)
        .insert([
          {
            id: crypto.randomUUID(),
            reference_number: "sample_ref_1",
            organization_id: "00000000-0000-0000-0000-000000000000",
            amount: 0,
            status: "available",
          }
        ]);

      if (createError) {
        console.error("Error creating payment_references table:", createError);
        toast.error("Failed to setup payment references table");
      } else {
        toast.success("Payment references table created successfully");
      }
    }
  } catch (error) {
    console.error("Error in setupPaymentReferencesTable:", error);
  }
}

// Setup reference_number column in organization_members if it doesn't exist
export async function setupOrganizationMembersReferenceColumn() {
  try {
    // Check if column exists
    const { data: columnCheck, error: checkError } = await supabase
      .from("organization_members" as any)
      .select("reference_number", { count: "exact" })
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking reference_number column:", checkError);
      return;
    }

    // If column doesn't exist, add it
    if (checkError?.code === 'PGRST116') {
      const { error: addError } = await supabase
        .from("organization_members" as any)
        .update({ reference_number: "" })
        .is("reference_number", null);

      if (addError) {
        console.error("Error adding reference_number column:", addError);
      } else {
        toast.success("Reference number column added to organization_members");
      }
    }
  } catch (error) {
    console.error("Error in setupOrganizationMembersReferenceColumn:", error);
  }
}

// Initialize database setup
export async function initializeDatabase() {
  await setupPaymentReferencesTable();
  await setupOrganizationMembersReferenceColumn();
}
