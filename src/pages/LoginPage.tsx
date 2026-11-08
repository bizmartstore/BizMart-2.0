import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSiteUrl } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/bizmart-7an2vg/assets/wg7i8epdpxf3/BIZMART.png";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, profile, profileComplete, profileLoading, isAuthReady } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Surface OAuth callback errors (they can arrive in the query string or hash).
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const description = search.get("error_description") || hash.get("error_description");
    const code = search.get("error") || hash.get("error");

    if (description || code) {
      setErrorMsg((description || code || "Google sign-in failed.").replace(/\+/g, " "));
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Once the session + profile are resolved (including the return trip from
  // Google), send the user to the right place.
  useEffect(() => {
    if (!isAuthReady || !user || profileLoading) return;

    const role = profile?.role;
    if (role === "main_admin" || role === "member_admin") {
      navigate("/admin", { replace: true });
    } else if (role === "guidance") {
      navigate("/guidance", { replace: true });
    } else if (!profileComplete) {
      navigate("/setup-profile", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [isAuthReady, user, profile?.role, profileLoading, profileComplete, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getSiteUrl()}/login`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      toast.error("Google sign-in failed", { description: error.message });
      return;
    }

    // Success -> the browser is redirected to Google, so keep the spinner on.
  };

  const signingIn = loading || (!!user && profileLoading);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-secondary px-6 pt-12 pb-10 rounded-b-[2rem] text-center">
        <img src={LOGO_URL} alt="BizMart" className="h-14 mx-auto mb-2" />
        <p className="text-secondary-foreground/70 text-sm">Your campus store, anytime!</p>
      </div>

      <div className="flex-1 px-5 pt-10 pb-8 flex flex-col">
        <div className="text-center mb-8">
          <h2 className="text-xl font-extrabold text-foreground mb-1">Welcome to BizMart!</h2>
          <p className="text-sm text-muted-foreground">
            Sign in with your Google account to continue.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-bold text-destructive">Sign-in failed</span>
            </div>
            <p className="text-[11px] text-destructive/80 leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="w-full h-12 text-sm font-bold rounded-xl gap-3 bg-white text-foreground border border-input hover:bg-muted/60 disabled:opacity-70 shadow-sm"
        >
          {signingIn ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground mt-4 leading-relaxed">
          Use your school or personal Google account.
          <br />
          No password needed — BizMart never sees it.
        </p>

        <div className="flex-1" />

        <p className="text-center text-[10px] text-muted-foreground">
          By continuing, you agree to BizMart's terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
