// Database setup and migration helper functions
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Setup payment references table for organization join requests
export async function setupPaymentReferencesTable() {
  try {
    // Check if table exists
    const { data: tableCheck, error: checkError } = await supabase
      .from("payment_references")
      .select("id")
      .limit(1);

    if (checkError && checkError.code !== 'PGRST205') {
      console.error("Error checking payment_references table:", checkError);
      return;
    }

    // If table doesn't exist, create it
    if (checkError?.code === 'PGRST205') {
      const { error: createError } = await supabase
        .from("payment_references")
        .create({
          id: "payment_references",
          columns: [
            { name: "id", type: "uuid", isPrimaryKey: true, isRequired: true },
            { name: "organization_id", type: "uuid", isRequired: true },
            { name: "reference_number", type: "text", isRequired: true },
            { name: "amount", type: "numeric", isRequired: true },
            { name: "status", type: "text", isRequired: true, default: "available" },
            { name: "created_at", type: "timestamp with time zone", isRequired: true, default: "now()" },
            { name: "used_by", type: "uuid" },
            { name: "used_at", type: "timestamp with time zone" },
          ],
          foreignKeys: [
            {
              name: "payment_references_organization_id_fkey",
              column: "organization_id",
              references: "organizations(id)",
            },
            {
              name: "payment_references_used_by_fkey",
              column: "used_by",
              references: "profiles(id)",
            },
          ],
        });

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
      .from("organization_members")
      .select("reference_number")
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking reference_number column:", checkError);
      return;
    }

    // If column doesn't exist, add it
    if (checkError?.code === 'PGRST116') {
      const { error: addError } = await supabase
        .rpc("add_column_if_not_exists", {
          table_name: "organization_members",
          column_name: "reference_number",
          column_type: "text",
        });

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
