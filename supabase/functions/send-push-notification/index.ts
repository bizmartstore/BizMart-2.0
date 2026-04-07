import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAuth } from "https://deno.land/x/firebase@0.12.0/auth/mod.ts";
import { getMessaging, getToken } from "https://deno.land/x/firebase@0.12.0/messaging/mod.ts";

// Firebase service account key (store this as a Supabase secret)
const FIREBASE_SERVICE_ACCOUNT_KEY = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY")!;

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  role?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { userId, title, body, icon, url, role } = await req.json() as PushNotificationPayload & { userId: string };

    if (!userId || !title || !body) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only send to customers
    if (role !== "customer") {
      console.log(`[send-push-notification] Skipping non-customer user ${userId} with role ${role}`);
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get FCM tokens for the user
    const { data: tokens, error: tokenError } = await (req as any).supabase
      .from("user_push_tokens")
      .select("fcm_token")
      .eq("user_id", userId)
      .eq("role", "customer");

    if (tokenError) {
      console.error("[send-push-notification] Error fetching tokens:", tokenError);
      return new Response(JSON.stringify({ error: "Failed to fetch tokens" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!tokens || tokens.length === 0) {
      console.log(`[send-push-notification] No FCM tokens found for user ${userId}`);
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Firebase Admin SDK
    const admin = await import("https://deno.land/x/firebase@0.12.0/admin/mod.ts");
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_KEY);
    
    admin.initializeApp({
      credential: admin.cert(serviceAccount),
    });

    const messaging = admin.messaging();

    // Send to all tokens for this user (multiple devices)
    const responses = await Promise.allSettled(
      tokens.map((t: any) =>
        messaging.send({
          token: t.fcm_token,
          notification: {
            title,
            body,
            icon: icon || "/pwa-192x192.png",
          },
          data: {
            url: url || "/",
            role: role || "customer",
            click_action: "FLUTTER_NOTIFICATION_CLICK", // For Android
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "customer_notifications",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
              },
            },
          },
        })
      )
    );

    const successful = responses.filter(r => r.status === "fulfilled").length;
    const failed = responses.filter(r => r.status === "rejected").length;

    console.log(`[send-push-notification] Sent to ${userId}: ${successful} success, ${failed} failed`);

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successful, 
      failed,
      total: tokens.length 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-push-notification] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});