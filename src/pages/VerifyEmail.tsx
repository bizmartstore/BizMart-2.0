import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      if (!user) return;
      
      // Check if email is confirmed
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser?.confirmed_at) {
        setVerified(true);
        setChecking(false);
      } else {
        // Keep checking every 2 seconds
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
    </div>
  );

  if (verified) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-primary/10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">✅ Email Verified!</h1>
          <p className="text-lg text-primary-foreground">
            Your email has been successfully verified. You can now log in.
          </p>
          <button            onClick={() => navigate("/")}
            className="mt-6 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Checking verification...</p>
      </div>
    </div>
  );
}