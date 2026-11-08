import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function getSiteUrl(): string {
  // When testing from a dev server (localhost or a LAN address on a phone),
  // come back to that same origin instead of the production URL.
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isDevHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host);
    if (isDevHost) return window.location.origin;
  }
  return import.meta.env.VITE_SITE_URL || window.location.origin;
}

const ADMIN_EMAIL_ROLES: Record<string, string> = {
  "sheethappenswithjaa@gmail.com": "main_admin",
  "bizmartadmin@gmail.com": "member_admin",
};

function isFilled(value?: string | null): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed !== "" && trimmed.toUpperCase() !== "N/A";
}

/** Fields a student must provide once, right after their first Google sign-in. */
export const REQUIRED_PROFILE_FIELDS = [
  "first_name",
  "last_name",
  "school",
  "grade_level",
  "section",
] as const;

export type ProfileFields = {
  first_name?: string | null;
  last_name?: string | null;
  school?: string | null;
  grade_level?: string | null;
  section?: string | null;
};

export function isProfileComplete(profile?: ProfileFields | null): boolean {
  if (!profile) return false;
  return REQUIRED_PROFILE_FIELDS.every((field) => isFilled(profile[field]));
}

/**
 * Best-effort extraction of the name/photo Google returns in
 * `raw_user_meta_data`. Google usually provides `full_name` / `name` and
 * `picture`, but some payloads include `given_name` / `family_name`.
 */
function deriveGoogleIdentity(meta: Record<string, any>) {
  const fullName: string = meta.full_name || meta.name || "";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstFromFull = parts[0] || "";
  const lastFromFull = parts.length > 1 ? parts.slice(1).join(" ") : "";

  return {
    first_name: meta.first_name || meta.given_name || firstFromFull,
    last_name: meta.last_name || meta.family_name || lastFromFull,
    avatar_url: meta.avatar_url || meta.picture || null,
  };
}

export async function ensureUserRecords(user: User): Promise<void> {
  if (!user) return;

  const meta = (user.user_metadata || {}) as Record<string, any>;
  const email = user.email || "";
  const google = deriveGoogleIdentity(meta);

  let { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, user_id, first_name, last_name, avatar_url, school, grade_level, section")
    .eq("user_id", user.id)
    .maybeSingle();

  // Adoption: if the current auth user has no profile row yet, but an older
  // row exists for the SAME EMAIL (created under a legacy email/password
  // sign-in or before the Google-only switch), adopt it instead of creating
  // a fresh "customer" row. This preserves the manual role (e.g.
  // member_admin) and any data the user already had.
  if (!existingProfile && email) {
    try {
      const { data: legacyByEmail } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("email", email)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (legacyByEmail) {
        await supabase
          .from("profiles")
          .update({ id: user.id, user_id: user.id } as any)
          .eq("id", legacyByEmail.id);
        existingProfile = legacyByEmail as any;
      }
    } catch (err) {
      console.warn("[auth] profile adoption lookup skipped:", err);
    }
  }

  const adminRole = ADMIN_EMAIL_ROLES[email.toLowerCase()];

  if (!existingProfile) {
    await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          user_id: user.id,
          first_name: google.first_name,
          last_name: google.last_name,
          email,
          school: meta.school || "",
          grade_level: meta.grade_level || "",
          section: meta.section || "",
          avatar_url: google.avatar_url,
          ...(adminRole ? { role: adminRole } : {}),
        } as any,
        { onConflict: "user_id" }
      );
  } else {
    // Never overwrite data the user already entered. Only backfill fields that
    // are still empty (e.g. a profile created by the DB trigger before we could
    // read the Google name/photo).
    const patch: Record<string, any> = {};

    if (!isFilled(existingProfile.first_name) && google.first_name) {
      patch.first_name = google.first_name;
    }
    if (!isFilled(existingProfile.last_name) && google.last_name) {
      patch.last_name = google.last_name;
    }
    if (!existingProfile.avatar_url && google.avatar_url) {
      patch.avatar_url = google.avatar_url;
    }
    if (!isFilled(existingProfile.school) && meta.school) {
      patch.school = meta.school;
    }
    if (!isFilled(existingProfile.grade_level) && meta.grade_level) {
      patch.grade_level = meta.grade_level;
    }
    if (!isFilled(existingProfile.section) && meta.section) {
      patch.section = meta.section;
    }
    if (adminRole) {
      patch.role = adminRole;
    }

    if (Object.keys(patch).length > 0) {
      await supabase
        .from("profiles")
        .update(patch as any)
        .eq("user_id", user.id);
    }
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
