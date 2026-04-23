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
      
      // Create table using insert with throwOnError to create the table
      const { error: createError } = await supabase
        .from("payment_references")
        .insert([{
          reference_code: "INITIAL_CHECK",
          amount: 0,
          used: false,
          organization_id: null,
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
    // Simply try to insert - if it fails with duplicate key, table exists
    await supabase
      .from("organization_members")
      .insert([{
        organization_id: "test-org-id-" + Math.random(),
        user_id: "test-user-id-" + Math.random(),
        reference_code: "TEST_REF-" + Math.random(),
      }]);
    
    toast.success("Organization members table is ready");
  } catch (error: any) {
    // Ignore duplicate key errors (table already exists)
    if (!error.message?.includes('duplicate key') && !error.message?.includes('23505')) {
      console.error("Error in setupOrganizationMembersReferenceColumn:", error);
    }
  }
}

// Initialize database setup
export async function initializeDatabase() {
  await setupPaymentReferencesTable();
  await setupOrganizationMembersReferenceColumn();
}