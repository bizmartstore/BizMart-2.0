import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function getSiteUrl(): string {
  return import.meta.env.VITE_SITE_URL || window.location.origin;
}

const ADMIN_EMAIL_ROLES: Record<string, string> = {
  "sheethappenswithjaa@gmail.com": "main_admin",
  "bizmartadmin@gmail.com": "member_admin",
};

export async function ensureUserRecords(user: User): Promise<void> {
  if (!user) return;

  const meta = (user.user_metadata || {}) as Record<string, any>;
  const email = user.email || "";

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const adminRole = ADMIN_EMAIL_ROLES[email.toLowerCase()];

  if (!existingProfile) {
    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          user_id: user.id,
          first_name: meta.first_name || "",
          last_name: meta.last_name || "",
          email,
          school: meta.school || "",
          grade_level: meta.grade_level || "",
          section: meta.section || "",
          avatar_url: meta.avatar_url || null,
          ...(adminRole ? { role: adminRole } : {}),
        } as any,
        { onConflict: "user_id" }
      );
  } else if (adminRole) {
    await supabase
      .from("profiles")
      .update({ role: adminRole })
      .eq("user_id", user.id);
  }

  const { data: existingWallet } = await supabase
    .from("bcoins_wallets")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingWallet) {
    await supabase
      .from("bcoins_wallets")
      .upsert({ user_id: user.id, balance: 0 }, { onConflict: "user_id" });
  }

  try {
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminRole && !existingRole) {
      await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: adminRole } as any)
        .maybeSingle();
    }
  } catch (err) {
    console.warn("[auth] user_roles sync skipped:", err);
  }
}