import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use anon key instead of service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_ANON_KEY")!;  // Use anon key instead of service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Delete print orders older than 24 hours
    const { data: oldPrintOrders, error: fetchError } = await supabase
      .from("print_orders")
      .select("id, file_url, file_name")
      .lt("created_at", cutoff);

    if (fetchError) throw fetchError;

    let deletedFiles = 0;
    let deletedOrders = 0;

    if (oldPrintOrders && oldPrintOrders.length > 0) {
      // Delete associated storage files if any exist
      const fileUrls = oldPrintOrders
        .filter((o: any) => o.file_url)
        .map((o: any) => {
          // Extract path from storage URL
          const match = o.file_url.match(/\/storage\/v1\/object\/public\/(.+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      if (fileUrls.length > 0) {
        // Try to remove files from storage buckets
        for (const filePath of fileUrls) {
          const parts = filePath.split("/");
          const bucket = parts[0];
          const path = parts.slice(1).join("/");
          try {
            await supabase.storage.from(bucket).remove([path]);
            deletedFiles++;
          } catch (_) {
            // File may already be deleted
          }
        }
      }

      // Delete the print order records
      const ids = oldPrintOrders.map((o: any) => o.id);
      const { error: deleteError } = await supabase
        .from("print_orders")
        .delete()
        .in("id", ids);

      if (deleteError) throw deleteError;
      deletedOrders = ids.length;
    }

    // Also clean up old notification logs older than 7 days to save space
    const notifCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: notifError } = await supabase
      .from("notification_logs")
      .delete()
      .lt("created_at", notifCutoff);

    if (notifError) console.warn("Failed to clean notifications:", notifError);

    return new Response(
      JSON.stringify({
        success: true,
        deleted_orders: deletedOrders,
        deleted_files: deletedFiles,
        cutoff,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
