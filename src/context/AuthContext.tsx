function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: profileData, error: profError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (!profError && profileData) {
            setProfile(profileData);
          } else {
            // 2. If profile is missing, create it
            if (!profileData && !profError) {
              console.log("[AuthContext] Profile missing, creating...");
              const { data: newProf, error: insertError } = await supabase
                .from("profiles")
                .insert({
                  user_id: user.id,
                  email: user.email,
                  first_name: "",
                  last_name: "",
                  school: "",
                  section: "",
                  grade_level: "",
                  bcoins: 0,
                })
                .select()
                .single();

              if (!insertError) setProfile(newProf);
              else console.warn("[AuthContext] Profile creation failed:", insertError.message);
            }
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("[AuthContext] Error loading user:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data: profileData, error: profError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single();

          if (!profError && profileData) {
            setProfile(profileData);
          } else {
            if (!profileData && !profError) {
              console.log("[AuthContext] Profile missing, creating...");
              const { data: newProf, error: insertError } = await supabase
                .from("profiles")
                .insert({
                  user_id: session.user.id,
                  email: session.user.email,
                  first_name: "",
                  last_name: "",
                  school: "",
                  section: "",
                  grade_level: "",
                  bcoins: 0,
                })
                .select()
                .single();

              if (!insertError) setProfile(newProf);
              else console.warn("[AuthContext] Profile creation failed:", insertError.message);
            }
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider, useAuth };