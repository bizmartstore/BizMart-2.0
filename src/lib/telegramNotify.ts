export async function sendTelegramOrderNotify(status: string, order: Record<string, any>) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const res = await fetch(`${supabaseUrl}/functions/v1/telegram-order-notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ status, order }),
    });

    const data = await res.json();
    console.log("[Telegram] Notify result:", data);
  } catch (e) {
    console.warn("[Telegram] Failed to send notification:", e);
  }
}