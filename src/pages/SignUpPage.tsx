import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ShoppingBag, Eye, EyeOff, ArrowLeft, Mail, RefreshCw } from "lucide-react";

const GRADE_LEVELS = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "", lastName: "", section: "", gradeLevel: "", school: "", email: "", password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
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
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else if (data.user) {
      setIsSubmitted(true);
      toast({ title: "Account created! 🎉", description: "Check your Gmail to verify your account." });
    }
    setLoading(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <Mail className="h-12 w-12 text-primary mb-4 animate-bounce" />
        <h2 className="text-2xl font-extrabold mb-2">Check your Gmail!</h2>
        <p className="text-sm text-muted-foreground mb-8">We've sent a verification link to <strong>{form.email}</strong>.</p>
        <Button onClick={() => navigate("/login")} className="w-full rounded-xl font-bold">Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary px-4 py-6 rounded-b-[2rem]">
        <button onClick={() => navigate(-1)} className="mb-3"><ArrowLeft className="h-5 w-5 text-white" /></button>
        <h1 className="text-xl font-extrabold text-white">Create Account</h1>
      </div>
      <div className="flex-1 px-5 pt-5 pb-8 overflow-y-auto">
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs font-bold">Last Name</Label><Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></div>
            <div><Label className="text-xs font-bold">First Name</Label><Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></div>
          </div>
          <div><Label className="text-xs font-bold">School</Label><Input value={form.school} onChange={e => setForm({...form, school: e.target.value})} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold">Grade Level</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.gradeLevel} onChange={e => setForm({...form, gradeLevel: e.target.value})} required>
                <option value="">Select</option>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div><Label className="text-xs font-bold">Section</Label><Input value={form.section} onChange={e => setForm({...form, section: e.target.value})} required /></div>
          </div>
          <div><Label className="text-xs font-bold">Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
          <div>
            <Label className="text-xs font-bold">Password</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-bold rounded-xl" disabled={loading}>{loading ? "Creating..." : "Sign Up"}</Button>
        </form>
      </div>
    </div>
  );
}