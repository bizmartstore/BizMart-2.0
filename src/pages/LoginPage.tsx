// ... (keep all existing imports and code until the handleLogin function)

// REPLACE the handleLogin function with this corrected version:
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setUnconfirmed(false);
  setErrorMsg(null);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: form.email,
    password: form.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      setUnconfirmed(true);
      setErrorMsg("You need to confirm your email before you can log in.");
      toast({ 
        title: "Email not verified", 
        description: "Please check your Gmail to confirm your account.", 
        variant: "destructive" 
      });
    } else {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  } else if (data.user) {
    // ALWAYS check role and navigate accordingly
    try {
      const { data: roleData, error: roleError } = await (supabase as any)
        .rpc('get_user_role', { _user_id: data.user.id });

      if (!roleError && roleData?.role) {
        if (roleData.role === 'main_admin' || roleData.role === 'member_admin') {
          toast({ title: "Welcome back, Admin! 👑" });
          navigate('/admin');
        } else {
          toast({ title: "Welcome back! 🎉" });
          navigate('/');
        }
      } else {
        // If role check fails, default to home
        navigate('/');
      }
    } catch (err) {
      console.error("Role check failed:", err);
      navigate('/');
    }
  }
  setLoading(false);
};

// ... (rest of the file remains the same)