import { ShoppingBag, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { notifyAdminNewRegistration } from "@/lib/notifications"; // now exported
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

const LOGO_URL = "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/bizmart-7an2vg/assets/wg7i8epdpxf3/BIZMART.png";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email to confirm your account!" });
      if (data.user) {
        // Notify admin of new registration
        notifyAdminNewRegistration(
          `${data.user.user_metadata?.first_name} ${data.user.user_metadata?.last_name}`,
          data.user.email
        );
        navigate("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-secondary px-6 pt-12 pb-10 rounded-b-[2rem] text-center">
        <img src={LOGO_URL} alt="BizMart" className="h-14 mx-auto mb-2" />
        <p className="text-secondary-foreground/70 text-sm">Your campus store, anytime!</p>
      </div>

      <div className="flex-1 px-5 pt-8">
        <h2 className="text-xl font-extrabold text-foreground mb-1">Welcome to BizMart!</h2>
        <p className="text-sm text-muted-foreground mb-6">Create your account</p>

        <form onSubmit={handleSignUp} className="space-y-4">
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
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-bold">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}