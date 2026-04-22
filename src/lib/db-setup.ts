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
        // Create the table using the SQL endpoint
        const { error: sqlError } = await fetch(supabase.url + '/rest/v1/', {
          method: 'POST',
          headers: {
            'apikey': supabase.key,
            'Authorization': `Bearer ${supabase.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            type: 'create',
            table: 'payment_references',
            schema: 'public',
            definition: {
              id: { type: 'uuid', primary_key: true, default: 'gen_random_uuid()' },
              organization_id: { type: 'uuid', references: 'organizations(id)', on_delete: 'cascade' },
              reference_code: { type: 'text' },
              amount: { type: 'numeric', default: 0 },
              status: { type: 'text', default: 'available' },
              used: { type: 'boolean', default: false },
              used_by: { type: 'uuid', references: 'auth.users(id)', on_delete: 'set null' },
              used_at: { type: 'timestamptz' },
              created_at: { type: 'timestamptz', default: 'now()' },
              updated_at: { type: 'timestamptz', default: 'now()' }
            }
          })
        });

        if (sqlError) {
          console.error("Error creating payment_references table:", sqlError);
          toast.error("Failed to setup payment references table");
        } else {
          // Create indexes
          await supabase
            .from("payment_references")
            .select("*", { head: true, count: 'exact' });

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
        .rpc('execute_sql', {
          sql: 'ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS reference_number TEXT DEFAULT NULL'
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