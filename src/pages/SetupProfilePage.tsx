import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, Loader2, Lock, LogOut } from "lucide-react";

const GRADE_LEVELS = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

function cleanName(value?: string | null, isDefaultName = false): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed === "N/A") return "";
  if (isDefaultName && trimmed === "Student") return "";
  return trimmed;
}

export default function SetupProfilePage() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    profileLoading,
    profileComplete,
    isAuthReady,
    refreshProfile,
    signOut,
  } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    school: "",
    gradeLevel: "",
    section: "",
  });
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  const metadata = useMemo(() => (user?.user_metadata || {}) as Record<string, any>, [user]);
  const fullName: string = metadata.full_name || metadata.name || "";
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  // Prefill from the Google identity (via the profile row and user metadata).
  useEffect(() => {
    if (initialized || profileLoading || !isAuthReady) return;

    setForm({
      firstName:
        cleanName(profile?.first_name, true) ||
        cleanName(metadata.given_name) ||
        cleanName(nameParts[0]),
      lastName:
        cleanName(profile?.last_name) ||
        cleanName(metadata.family_name) ||
        cleanName(nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""),
      school: cleanName(profile?.school) || cleanName(metadata.school),
      gradeLevel: cleanName(profile?.grade_level) || cleanName(metadata.grade_level),
      section: cleanName(profile?.section) || cleanName(metadata.section),
    });
    setInitialized(true);
  }, [initialized, profileLoading, isAuthReady, profile, metadata, nameParts]);

  // Route away when there is no session, when the profile is already complete,
  // or when an admin/guidance account lands here.
  useEffect(() => {
    if (!isAuthReady) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (profileLoading) return;

    const role = profile?.role;
    if (role === "main_admin" || role === "member_admin") {
      navigate("/admin", { replace: true });
      return;
    }

    if (role === "guidance") {
      navigate("/guidance", { replace: true });
      return;
    }

    if (profileComplete) {
      navigate("/", { replace: true });
    }
  }, [isAuthReady, user, profileLoading, profileComplete, profile?.role, navigate]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const values = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      school: form.school.trim(),
      grade_level: form.gradeLevel.trim(),
      section: form.section.trim(),
    };

    if (!values.first_name || !values.last_name || !values.school || !values.grade_level || !values.section) {
      toast.error("Please complete all fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...values,
        email: user.email || "",
        updated_at: new Date().toISOString(),
      };

      const { data: updatedRows, error } = await supabase
        .from("profiles")
        .update(payload as any)
        .eq("user_id", user.id)
        .select("id");

      if (error) throw error;

      // Very old accounts may not have a profile row yet.
      if (!updatedRows || updatedRows.length === 0) {
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert(
            { id: user.id, user_id: user.id, ...payload } as any,
            { onConflict: "user_id" }
          );
        if (upsertError) throw upsertError;
      }

      // Keep the auth metadata in sync for other clients/fallbacks.
      try {
        await supabase.auth.updateUser({ data: values });
      } catch {
        // non-critical
      }

      await refreshProfile();
      toast.success("You're all set! Welcome to BizMart 🎉");
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("[SetupProfile] save failed:", err);
      toast.error("Could not save your profile", { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchAccount = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (!isAuthReady || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const avatarUrl = profile?.avatar_url || metadata.avatar_url || metadata.picture || null;
  const initial = (form.firstName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary px-4 pt-8 pb-6 rounded-b-[2rem]">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-white font-extrabold text-lg">{initial}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-white leading-tight">One-time setup</h1>
            <p className="text-white/70 text-xs truncate">{user?.email}</p>
          </div>
          <GraduationCap className="h-6 w-6 text-white/80" />
        </div>
      </div>

      <div className="flex-1 px-5 pt-5 pb-8 overflow-y-auto">
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Tell us a bit about yourself. This is only asked once — next time you sign in
          with Google, you'll go straight to the home page.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Last Name</Label>
              <Input value={form.lastName} onChange={update("lastName")} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">First Name</Label>
              <Input value={form.firstName} onChange={update("firstName")} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">School</Label>
            <Input
              value={form.school}
              onChange={update("school")}
              placeholder="e.g. Your School Name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Grade Level</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.gradeLevel}
                onChange={update("gradeLevel")}
                required
              >
                <option value="">Select</option>
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Section</Label>
              <Input value={form.section} onChange={update("section")} placeholder="e.g. Sampaguita" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Email</Label>
            <div className="relative">
              <Input value={user?.email || ""} readOnly disabled className="pr-10 opacity-80" />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground">
              From your Google account — no password needed.
            </p>
          </div>

          <Button type="submit" className="w-full h-12 font-bold rounded-xl" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={handleSwitchAccount}
          className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Use a different Google account
        </button>
      </div>
    </div>
  );
}
