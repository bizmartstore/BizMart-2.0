import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { serve as serveStatic } from "https://deno.land/std@0.224.0/http/file_server.ts";

/**
 * POST /api/generate-description
 * Body: { productName: string }
 * Returns: { description: string }
 *
 * This endpoint is **server‑only** – the Gemini API key lives in
 * process.env.GEMINI_API_KEY and is never sent to the browser.
 */
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Parse JSON body  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { productName } = body;
  if (!productName || typeof productName !== "string") {
    return new Response(JSON.stringify({ error: "productName is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build the Gemini request
  const geminiPrompt = `Generate a concise, engaging product description for a product named "${productName}". The description should be 2‑3 sentences, highlight key features/benefits, and be suitable for a school‑store listing.`;
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: geminiPrompt,
          },
        ],
      },
    ],
  };

  // Call Gemini via its REST API
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  const geminiResult = await geminiResponse.json();

  // Handle possible Gemini errors
  if (geminiResult.error) {
    console.error("Gemini API error:", geminiResult.error);
    return new Response(JSON.stringify({ error: "Failed to generate description" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Extract the generated description
  const description = geminiResult.candidates?.[0]?.content?.[0]?.parts?.[0]?.text?.trim() ?? "";

  // Fallback if something went wrong
  const fallbackDescription =
    "A high‑quality product that meets your needs and adds value to your collection.";

  const responseBody = {
    description: description || fallbackDescription,
  };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });