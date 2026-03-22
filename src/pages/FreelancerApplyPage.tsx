import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, GraduationCap, BookOpen, Award, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function FreelancerApplyPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    academic_strengths: "",
    subjects: "",
    experience: "",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await (supabase as any).from("freelancer_profiles").insert({
        user_id: user.id,
        academic_strengths: form.academic_strengths.trim(),
        subjects: form.subjects.split(",").map(s => s.trim()),
        experience: form.experience.trim(),
        bio: form.bio.trim(),
        status: "pending",
      });

      if (error) throw error;
      setSubmitted(true);
      toast.success("Application submitted! 📝");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="px-6 mt-20 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="font-extrabold text-xl mb-3">Application Received!</h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Your application to become a BizMart Freelancer has been submitted. Our moderators will review your qualifications and notify you once approved.
          </p>
          <Button onClick={() => navigate("/jobs")} className="w-full h-12 font-bold rounded-xl">
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-sm ml-2">Become a Freelancer</span>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg">Freelancer Application</h1>
            <p className="text-xs text-muted-foreground">Share your knowledge and earn</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-primary" /> Academic Strengths
            </Label>
            <Input 
              placeholder="e.g. Consistent Honor Student, Math Enthusiast" 
              value={form.academic_strengths}
              onChange={(e) => setForm({...form, academic_strengths: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Subjects of Expertise
            </Label>
            <Input 
              placeholder="e.g. Mathematics, Science, Accounting (comma separated)" 
              value={form.subjects}
              onChange={(e) => setForm({...form, subjects: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Tutoring Experience (Optional)</Label>
            <Textarea 
              placeholder="Describe any previous experience helping other students..." 
              className="rounded-xl text-xs"
              value={form.experience}
              onChange={(e) => setForm({...form, experience: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Short Bio / Approach</Label>
            <Textarea 
              placeholder="Explain how you can help other students understand lessons effectively..." 
              className="min-h-[100px] rounded-xl text-xs"
              value={form.bio}
              onChange={(e) => setForm({...form, bio: e.target.value})}
              required
            />
          </div>

          <div className="bg-muted/30 p-4 rounded-2xl border border-border mb-6">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              By applying, you agree to follow the **BizMart Learning Assistance Policy**. You must only guide and tutor clients, and never complete graded work for them.
            </p>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full h-12 font-bold rounded-xl" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}