import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      if (!user) return;
      
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser?.confirmed_at) {
        setVerified(true);
        setChecking(false);
      } else {
        const interval = setInterval(checkVerification, 2000);
        return () => clearInterval(interval);
      }
    };

    checkVerification();
  }, [user]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (verified) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-primary/10 p-6 text-center">
        <h1 className="text-3xl font-bold text-primary mb-4">✅ Email Verified!</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Your email has been successfully verified. You can now log in.
        </p>
        <button onClick={() => navigate("/login")} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-lg text-muted-foreground">Checking verification...</p>
    </div>
  );
}