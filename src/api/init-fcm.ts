import { NextResponse } from "next/server";
import { supabase } from "@/integrations/supabase/client";

export async function GET() {
  // This endpoint can be called from client to ensure token is registered
  // In practice, token registration happens in useFCM hook on mount
  return NextResponse.json({ message: "FCM setup complete" });
}