import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ShoppingBag, Eye, EyeOff, ArrowLeft, Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import { notifyAdminNewRegistration } from "@/lib/notifications";

const GRADE_LEVELS = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    section: "",
    gradeLevel: "",
    school: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resending, setResending] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    // Use the current origin for the redirect URL
    const redirectTo = `${window.location.origin}/login`;

    const { error } = await supabase.auth.signUp({
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
        emailRedirectTo: redirectTo,
      },
    });

    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      notifyAdminNewRegistration(`${form.firstName} ${form.lastName}`, form.email);
      setIsSubmitted(true);
      toast({ title: "Account created! 🎉", description: "Please check your Gmail to verify your account." });
    }
  };

  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: form.email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });
    setResending(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Verification sent! 📧", description: "Check your Gmail inbox (and spam folder)." });
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Mail className="h-10 w-10 text-primary animate-bounce" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">Check your Gmail!</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          We've sent a verification link to <strong className="text-foreground">{form.email}</strong>.<br />
          Please click the link in the email to activate your account.
        </p>
        
        <div className="w-full space-y-3">
          <Button onClick={() => navigate("/login")} variant="outline" className="w-full h-12 rounded-xl font-bold">
            Go to Login
          </Button>
          <button 
            onClick={handleResend} 
            disabled={resending}
            className="text-xs text-primary font-bold flex items-center justify-center gap-1.5 mx-auto py-2"
          >
            {resending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Didn't get the email? Resend link
          </button>
        </div>

        <div className="mt-12 p-4 bg-muted/50 rounded-2xl border border-border text-left">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
            <span className="text-xs font-bold">Next Steps</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            1. Open your Gmail app.<br />
            2. Look for an email from BizMart.<br />
            3. Click "Confirm your email".<br />
            4. You will be redirected back here to log in!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary px-4 pt-6 pb-6 rounded-b-[2rem]">
        <button onClick={() => navigate(-1)} className="mb-3">
          <ArrowLeft className="h-5 w-5 text-primary-foreground" />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="h-6 w-6 text-primary-foreground" />
          <h1 className="text-xl font-extrabold text-primary-foreground">Create Account</h1>
        </div>
        <p className="text-primary-foreground/70 text-xs">Join BizMart and start shopping!</p>
      </div>

      <div className="flex-1 px-5 pt-5 pb-8 overflow-y-auto">
        <form onSubmit={handleSignUp} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Last Name</Label>
              <Input
                placeholder="Dela Cruz"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">First Name</Label>
              <Input
                placeholder="Juan"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">School</Label>
            <Input
              placeholder="Enter your school name"
              value={form.school}
              onChange={(e) => update("school", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Grade Level</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.gradeLevel}
                onChange={(e) => update("gradeLevel", e.target.value)}
                required
              >
                <option value="">Select grade</option>
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">Section</Label>
              <Input
                placeholder="e.g. Section A"
                value={form.section}
                onChange={(e) => update("section", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Email Address</Label>
            <Input
              type="email"
              placeholder="student@school.edu"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
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

          <Button type="submit" className="w-full h-12 text-sm font-bold rounded-xl mt-2" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-bold">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}