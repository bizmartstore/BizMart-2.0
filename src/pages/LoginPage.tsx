<![CDATA[
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ShoppingBag, Eye, EyeOff, ArrowLeft, Mail, RefreshCw } from "lucide-react";

const GRADE_LEVELS = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user is admin
        const { data: roleData } = await (supabase as any)
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        if (roleData?.role === "main_admin" || roleData?.role === "member_admin") {
          localStorage.setItem("isAdminLoggedIn", "true");
          localStorage.setItem("adminRole", roleData.role);
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnconfirmed(false);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data.user) {
      // Check user role immediately after login
      const { data: roleData, error: roleError } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!roleError && roleData?.role) {
        // Store admin status in localStorage for persistence
        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("adminRole", roleData.role);

        // Redirect based on role
        if (roleData.role === "main_admin" || roleData.role === "member_admin") {
          toast({
            title: "Welcome back, Admin!",
            description: `Logged in as ${roleData.role === "main_admin" ? "Main Admin" : "Member Admin"}`,
          });
          navigate("/admin");
          return;
        }
      }

      // Fallback: Check if email matches hardcoded admin (for testing)
      if (data.user.email === 'sheethappenswithjaa@gmail.com') {
        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("adminRole", "main_admin");
        navigate("/admin");
        return;
      }

      // Regular user flow
      toast({
        title: "Login successful!",
        description: "Welcome back to BizMart!",
      });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary px-4 py-6 rounded-b-[2rem]">
        <button onClick={() => navigate(-1)} className="mb-3">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-xl font-extrabold text-white">Login</h1>
      </div>
      <div className="flex-1 px-5 pt-5 pb-8 overflow-y-auto">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label className="text-xs font-bold">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-bold">Password</Label>
            <div className="relative mt-1">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-12 font-bold rounded-xl"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
            <p className="text-xs text-destructive font-medium">{errorMsg}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-primary font-bold"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
]]>