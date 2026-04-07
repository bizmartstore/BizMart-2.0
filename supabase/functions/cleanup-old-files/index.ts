import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowed storage buckets for cleanup
const ALLOWED_BUCKETS = ["print-orders", "news-images", "banners", "seller-images"];

// Validate file path to prevent directory traversal
const validateFilePath = (path: string): boolean => {
  // Reject paths with directory traversal sequences
  if (path.includes("..") || path.includes("./") || path.startsWith("/")) {
    return false;
  }
  
  // Only allow alphanumeric, hyphens, underscores, dots, and forward slashes
  if (!/^[a-zA-Z0-9._/-]+$/.test(path)) {
    return false;
  }
  
  // Extract bucket name (first segment before /)
  const parts = path.split("/");
  if (parts.length === 0) return false;
  
  const bucket = parts[0];
  return ALLOWED_BUCKETS.includes(bucket);
};

// Extract path from storage URL safely
const extractPathFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove leading slash and /storage/v1/object/public/ prefix if present
    const patterns = [
      /^\/storage\/v1\/object\/public\/(.+)$/,
      /^\/(.+)$/,
    ];
    
    for (const pattern of patterns) {
      const match = pathname.match(pattern);
      if (match) {
        const extracted = match[1];
        return validateFilePath(extracted) ? extracted : null;
      }
    }
    
    return null;
  } catch {
    return null;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user: caller } } = await supabase.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: caller.id });
    if (roleData !== "main_admin" && roleData !== "member_admin") {
      return new Response(JSON.stringify({ error: "Only admins can run cleanup" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        .map((o: any) => extractPathFromUrl(o.file_url))
        .filter(Boolean) as string[];

      if (fileUrls.length > 0) {
        // Group by bucket
        const byBucket: Record<string, string[]> = {};
        for (const filePath of fileUrls) {
          const parts = filePath.split("/");
          const bucket = parts[0];
          const path = parts.slice(1).join("/");
          if (!byBucket[bucket]) byBucket[bucket] = [];
          byBucket[bucket].push(path);
        }

        // Delete files from each bucket
        for (const [bucket, paths] of Object.entries(byBucket)) {
          try {
            const { error: deleteError } = await supabase.storage.from(bucket).remove(paths);
            if (deleteError) {
              console.warn(`Failed to delete files from bucket ${bucket}:`, deleteError.message);
            } else {
              deletedFiles += paths.length;
            }
          } catch (e) {
            console.warn(`Error deleting from bucket ${bucket}:`, e);
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

    // Log cleanup activity
    await supabase.from("admin_audit_logs").insert({
      admin_id: caller.id,
      action: "cleanup_old_files",
      details: { deleted_orders: deletedOrders, deleted_files: deletedFiles, cutoff },
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    });

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
    console.error("Cleanup error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});