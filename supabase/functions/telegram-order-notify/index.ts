import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") || "";

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN not configured");
}
if (!TELEGRAM_CHAT_ID) {
  throw new Error("TELEGRAM_CHAT_ID not configured");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { status, order } = await req.json();

    const items = order.items || [];
    const productNames = items.map((i: any) => i.name).join(", ") || "N/A";
    const totalQty = items.reduce((s: number, i: any) => s + (i.quantity || 0), 0);
    const method = order.delivery_type === "delivery" ? "🚚 Delivery" : "📦 Pickup";
    const orderId = order.id?.slice(0, 8) || "N/A";
    const buyerName = order.customer_name || "Customer";
    const gradeLevel = order.customer_grade_level || "N/A";
    const section = order.customer_section || "N/A";
    const contact = order.customer_contact || "N/A";
    const total = `₱${Number(order.total || 0).toLocaleString()}`;
    const now = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });

    let message = "";

    if (status === "pending") {
      message = `🛒 *NEW ORDER RECEIVED*

📦 Product: ${productNames}
👤 Buyer: ${buyerName}
🎓 Grade Level: ${gradeLevel}
🏫 Section: ${section}
📞 Contact: ${contact}

🔢 Quantity: ${totalQty}
💰 Total Price: ${total}
🆔 Order ID: #${orderId}

${method}
⏳ Status: Waiting for Admin Approval

🕐 ${now}`;
    } else if (status === "approved") {
      message = `✅ *ORDER APPROVED*

📦 Product: ${productNames}
👤 Buyer: ${buyerName}
🎓 Grade Level: ${gradeLevel}
🏫 Section: ${section}

🆔 Order ID: #${orderId}
${method}

📦 Status: Approved and waiting for confirmation

🕐 ${now}`;
    } else if (status === "completed") {
      message = `🎉 *ORDER CONFIRMED*

📦 Product: ${productNames}
👤 Buyer: ${buyerName}
🎓 Grade Level: ${gradeLevel}
🏫 Section: ${section}

🔢 Quantity: ${totalQty}
💰 Total Price: ${total}
🆔 Order ID: #${orderId}

${method}
✔ Status: Order Successfully Confirmed

🕐 ${now}`;
    } else if (status === "rejected") {
      message = `❌ *ORDER REJECTED*

📦 Product: ${productNames}
🆔 Order ID: #${orderId}

${method}
❌ Status: Order Rejected🕐 ${now}`;
    } else {
      message = `📋 Order #${orderId} status changed to: ${status}\n🕐 ${now}`;
    }

    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    const data = await res.json();
    console.log("[Telegram] Response:", JSON.stringify(data));

    return new Response(JSON.stringify({ success: data.ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[Telegram] Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});