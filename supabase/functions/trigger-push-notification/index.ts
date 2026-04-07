import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Firebase service account key (stored as Supabase secret)
const FIREBASE_SERVICE_ACCOUNT_KEY = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY")!;

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
    const { 
      user_id, 
      title, 
      message, 
      type, 
      icon, 
      link, 
      fcm_token 
    } = await req.json() as {
      user_id: string;
      title: string;
      message: string;
      type: string;
      icon?: string;
      link?: string;
      fcm_token: string;
    };

    if (!user_id || !title || !message || !fcm_token) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Firebase Admin
    const admin = await import("https://deno.land/x/firebase@0.12.0/admin/mod.ts");
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_KEY);
    
    admin.initializeApp({
      credential: admin.cert(serviceAccount),
    });

    const messaging = admin.messaging();

    // Send push notification
    const response = await messaging.send({
      token: fcm_token,
      notification: {
        title,
        body: message,
        icon: icon || "/pwa-192x192.png",
      },
      data: {
        url: link || "/",
        type: type || "general",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "customer_notifications",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            category: "CUSTOM_NOTIFICATION",
          },
        },
      },
    });

    console.log(`[trigger-push-notification] Successfully sent to ${user_id}: ${response}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message_id: response,
      user_id 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[trigger-push-notification] Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});