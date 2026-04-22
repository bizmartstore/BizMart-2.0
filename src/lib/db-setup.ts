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
      try {
        // Create the table using raw SQL
        const { error: sqlError } = await supabase
          .sql(`
            CREATE TABLE IF NOT EXISTS payment_references (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
              reference_code TEXT NOT NULL,
              amount NUMERIC(10,2) NOT NULL DEFAULT 0,
              status TEXT NOT NULL DEFAULT 'available',
              used BOOLEAN NOT NULL DEFAULT false,
              used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
              used_at TIMESTAMPTZ,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_payment_references_org_id ON payment_references(organization_id);
            CREATE INDEX IF NOT EXISTS idx_payment_references_reference_code ON payment_references(reference_code);
            CREATE INDEX IF NOT EXISTS idx_payment_references_used ON payment_references(used);
            CREATE INDEX IF NOT EXISTS idx_payment_references_created_at ON payment_references(created_at);
          `);

        if (sqlError) {
          console.error("Error creating payment_references table:", sqlError);
          toast.error("Failed to setup payment references table");
        } else {
          toast.success("Payment references table created successfully");
        }
      } catch (sqlError) {
        console.error("Error creating payment_references table:", sqlError);
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
