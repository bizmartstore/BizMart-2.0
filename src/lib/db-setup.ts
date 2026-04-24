// Database setup and migration helper functions
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Setup payment references table for organization join requests
export async function setupPaymentReferencesTable() {
  try {
    // Try to query the table to see if it exists
    const { error: checkError } = await supabase
      .from("payment_references")
      .select("id", { count: "exact" })
      .limit(1);

    // If table doesn't exist (PGRST116 error), create it
    if (checkError?.code === 'PGRST116') {
      // Try to create the table by inserting a record
      // This will fail if table doesn't exist, but we'll catch it
      try {
        const sampleId = crypto.randomUUID();
        const { error: insertError } = await supabase
          .from("payment_references")
          .insert([
            {
              id: sampleId,
              reference_code: "123456",
              organization_id: "00000000-0000-0000-0000-000000000000",
              amount: 0,
              status: "available",
              used: false,
            }
          ]);

        if (insertError) {
          console.error("Error creating payment_references table:", insertError);
          toast.error("Failed to setup payment references table");
        } else {
          // Clean up the sample record
          await supabase
            .from("payment_references")
            .delete()
            .eq("id", sampleId);
          
          toast.success("Payment references table created successfully");
        }
      } catch (insertError) {
        console.error("Error creating payment_references table:", insertError);
        toast.error("Failed to setup payment references table");
      }
    } else if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking payment_references table:", checkError);
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
