// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnconfirmed(false);
    setErrorMsg(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
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
    } else {
      toast({ title: "Welcome back! 🎉" });
      if (data.user) {
        // Check if user is admin via role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();
        
        if (roleData?.role === 'main_admin' || roleData?.role === 'member_admin') {
          navigate("/admin");
          return;
        }
      }
      navigate("/");
    }
  };

// ... (rest of component)