import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ShoppingBag, Eye, EyeOff, ArrowLeft } from "lucide-react";

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
  };
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
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
          // ✅ Explicitly set default role
          role: "customer",
        },
        emailRedirectTo: window.location.origin,
      };
      setLoading(false);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        // Notify admins about new registration
        notifyAdminNewRegistration(`${form.firstName} ${form.lastName}`, form.email);
        toast({ title: "Account created! 🎉", description: "Check your email to verify your account before logging in." });
        navigate("/login");
      }