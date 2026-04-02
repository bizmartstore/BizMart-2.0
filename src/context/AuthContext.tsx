import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "next-auth";
import { useNavigate } from "react-router-dom";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Increased timeout to prevent "Profile fetch timeout" warning
  const fetchProfile = useCallback(async (currentUser: User) => {
    console.log(`[AuthContext] Fetching profile for: ${currentUser.email}`);
    
    try {
      // Use a Promise.race to ensure we don't hang forever on a slow DB query      const profilePromise = (async () => {
        // 1. Try to fetch existing profile
        let { data: profData, error: profError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profError) {
          console.warn("[AuthContext] Profile fetch error:", profError.message);
        }

        const metadata = currentUser.user_metadata || {};

        // 2. If profile is missing, create it
        if (!profData && !profError) {
          console.log("[AuthContext] Profile missing, creating...");
          const { data: newProf, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: currentUser.id,
              email: currentUser.email,
              first_name: metadata.first_name || '',
              last_name: metadata.last_name || '',
              school: metadata.school || '',
              section: metadata.section || '',
              grade_level: metadata.grade_level || '',
              bcoins: 0            })
            .select()
            .single();
                    if (!insertError) profData = newProf;
          else console.warn("[AuthContext] Profile creation failed:", insertError.message);
        }

        // 3. Fetch role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        return { profData, roleData, metadata };
      })();

      // Timeout after 10 seconds (increased from 3s)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Profile fetch timeout")), 10000)
      );

      const result = await Promise.race([profilePromise, timeoutPromise]) as any;
      const { profData, roleData, metadata } = result;

      setProfile({
        id: currentUser.id,
        first_name: profData?.first_name || metadata.first_name || 'Student',
        last_name: profData?.last_name || metadata.last_name || '',
        section: profData?.section || metadata.section || 'N/A',
        grade_level: profData?.grade_level || metadata.grade_level || 'N/A',
        school: profData?.school || metadata.school || 'N/A',
        email: profData?.email || currentUser.email || '',
        avatar_url: profData?.avatar_url || metadata.avatar_url || null,
        bcoins: Number(profData?.bcoins || 0),
        role: roleData?.role || 'customer',
      });
      
      console.log("[AuthContext] Profile loaded successfully");
    } catch (err: any) {
      console.warn("[AuthContext] Profile fetch issue:", err.message);
      // Fallback to metadata if DB fails or times out
      const metadata = currentUser.user_metadata || {};
      setProfile({
        id: currentUser.id,
        first_name: metadata.first_name || 'Student',
        last_name: metadata.last_name || '',
        section: metadata.section || 'N/A',
        grade_level: metadata.grade_level || 'N/A',
        school: metadata.school || 'N/A',
        email: currentUser.email || '',
        avatar_url: metadata.avatar_url || null,
        bcoins: 0,
        role: 'customer',
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user);
  }, [user, fetchProfile]);

  return { user, loading, profile };
}