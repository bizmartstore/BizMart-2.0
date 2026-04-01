import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, RefreshCw } from "lucide-react";

const LOGO_URL = "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/bizmart-7an2vg/assets/wg7i8epdpxf3/BIZMART.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resending, setResending] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnconfirmed(false);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setUnconfirmed(true);
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
        if (data.user.email === 'sheethappenswithjaa@gmail.com') {
          navigate("/admin");
          return;
        }
        const { data: roleData } = await (supabase as any).rpc('get_user_role', { _user_id: data.user.id });
        if (roleData === 'main_admin' || roleData === 'member_admin') {
          navigate("/admin");
          return;
        }
      }
      navigate("/");
    }
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });
    setResending(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Link sent! 📧", description: "Check your Gmail inbox for the new verification link." });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-secondary px-6 pt-12 pb-10 rounded-b-[2rem] text-center">
        <img src={LOGO_URL} alt="BizMart" className="h-14 mx-auto mb-2" />
        <p className="text-secondary-foreground/70 text-sm">Your campus store, anytime!</p>
      </div>

      <div className="flex-1 px-5 pt-8">
        <h2 className="text-xl font-extrabold text-foreground mb-1">Welcome Back!</h2>
        <p className="text-sm text-muted-foreground mb-6">Log in to continue shopping</p>

        {unconfirmed && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-destructive" />
              <span className="text-xs font-bold text-destructive">Email Not Verified</span>
            </div>
            <p className="text-[11px] text-destructive/80 mb-3 leading-relaxed">
              You need to confirm your email before you can log in. Check your Gmail inbox for the verification link.
            </p>
            <Button 
              onClick={handleResend} 
              disabled={resending}
              variant="outline" 
              size="sm" 
              className="w-full h-9 text-[10px] font-bold border-destructive/30 text-destructive hover:bg-destructive/5"
            >
              {resending ? <RefreshCw className="h-3 w-3 animate-spin mr-1.5" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
              Resend Verification Link
            </Button>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <Button type="submit" className="w-full h-12 text-sm font-bold rounded-xl" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-bold">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}