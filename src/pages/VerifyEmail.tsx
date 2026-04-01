import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const { data: { user: refreshedUser } } = await supabase.auth.getUser();
        
        if (refreshedUser?.confirmed_at) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage("Your email could not be verified. Please try again or contact support.");
        }
      } catch (error: any) {
        console.error("Verification check error:", error);
        setStatus("error");
        setMessage("An error occurred while checking verification status.");
      }
    };

    checkVerification();
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center mb-6">
          <CheckCircle className="h-12 w-12 text-[hsl(var(--success))]" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Email Verified!</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          {message}
        </p>
        <Button onClick={() => navigate("/login")} size="lg" className="px-8 py-6 text-lg font-bold rounded-xl">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <span className="text-4xl">⚠️</span>
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-4">Verification Failed</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        {message}
      </p>
      <div className="space-y-3">
        <Button onClick={() => navigate("/signup")} variant="outline" size="lg" className="px-8 py-6 text-lg font-bold rounded-xl">
          Try Sign Up Again
        </Button>
        <Button onClick={() => window.location.reload()} size="lg" className="px-8 py-6 text-lg font-bold rounded-xl">
          Retry Verification
        </Button>
      </div>
    </div>
  );
}