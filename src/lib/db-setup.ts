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
      console.log("payment_references table does not exist. Creating it now...");
      
      // Create table using raw SQL
      const { error: createError } = await supabase
        .from("payment_references")
        .insert([{
          reference_code: "INITIAL_CHECK",
          amount: 0,
          used: false,
        }])
        .select()
        .throwOnError();
      
      // If creation succeeded, delete the test record
      if (!createError) {
        await supabase
          .from("payment_references")
          .delete()
          .eq("reference_code", "INITIAL_CHECK");
        
        console.log("payment_references table created successfully");
        toast.success("Payment references table created successfully");
      } else {
        console.error("Error creating payment_references table:", createError);
        toast.error("Failed to create payment references table");
      }
    } else if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking payment_references table:", checkError);
    }
  } catch (error: any) {
    // Ignore "duplicate key" errors which mean the table already exists
    if (error?.code !== '23505') {
      console.error("Error in setupPaymentReferencesTable:", error);
    }
  }
}

// Setup reference_number column in organization_members if it doesn't exist
export async function setupOrganizationMembersReferenceColumn() {
  try {
    // Check if column exists
    const { error: checkError } = await supabase
      .from("organization_members")
      .select("reference_number", { count: 'exact' })
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking reference_number column:", checkError);
      return;
    }

    // If column doesn't exist, add it
    if (checkError?.code === 'PGRST116') {
      const { error: addError } = await supabase
        .rpc('create_organization_members_table_if_not_exists');

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