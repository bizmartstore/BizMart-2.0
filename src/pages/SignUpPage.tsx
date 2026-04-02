// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          section: form.section,
          grade_level: form.gradeLevel,
          school: form.school,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else if (data.user) {
      setIsSubmitted(true);
      toast({ title: "Account created! 🎉", description: "Check your Gmail to verify your account." });
    }
    setLoading(false);
  };

// ... (rest of component)