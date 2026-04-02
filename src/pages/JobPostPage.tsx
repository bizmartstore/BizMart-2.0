import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Info, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  { id: "homework", name: "Homework Guidance", min: 50, icon: "📝" },
  { id: "study", name: "Study Assistance", min: 50, icon: "📖" },
  { id: "tutoring", name: "Subject Tutoring", min: 60, icon: "👨‍🏫" },
  { id: "presentation", name: "Presentation Coaching", min: 70, icon: "📊" },
  { id: "project", name: "Project Idea Help", min: 70, icon: "💡" },
  { id: "editing", name: "Editing Guidance", min: 80, icon: "✍️" },
  { id: "skills", name: "Academic Skill Support", min: 80, icon: "🎯" },
  { id: "creative", name: "Creative Academic Assistance", min: 80, icon: "🎨" },
];

export default function JobPostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    rate: "",
  });

  const selectedCat = CATEGORIES.find(c => c.id === form.category);
  const minRate = selectedCat?.min || 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (Number(form.rate) < minRate) {
      toast.error(`Minimum rate for this category is ₱${minRate}`);
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase as any).from("job_postings").insert({
        client_id: user.id,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        hourly_rate: Number(form.rate),
        status: "open",
      });

      if (error) throw error;

      toast.success("Job offer posted successfully! 🎓");
      navigate("/jobs");
    } catch (err: any) {
      toast.error(err.message || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-sm ml-2">Post a Job Offer</span>
      </div>

      <div className="px-4 mt-6">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span className="font-bold text-xs text-amber-700">Academic Integrity</span>
          </div>
          <p className="text-[10px] text-amber-700 leading-relaxed">
            Remember: Freelancers are only allowed to **guide and tutor**. Requesting someone to do your homework or projects for you is strictly prohibited and may result in a ban.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Job Title</Label>
            <Input 
              placeholder="e.g. Help with Algebra Equations" 
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Category</Label>
            <Select onValueChange={(v) => setForm({...form, category: v})}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name} (Min ₱{cat.min}/hr)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Description of Assistance Needed</Label>
            <Textarea 
              placeholder="Describe what you need help with..." 
              className="min-h-[100px] rounded-xl"
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Meeting Location (On Campus)</Label>
            <Input 
              placeholder="e.g. Library, Study Area, BizMart Store" 
              value={form.location}
              onChange={(e) => setForm({...form, location: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold">Hourly Rate (₱)</Label>
              {form.category && (
                <span className="text-[10px] text-muted-foreground">Min: ₱{minRate}/hr</span>
              )}
            </div>
            <Input 
              type="number" 
              placeholder={`Min ₱${minRate}`}
              value={form.rate}
              onChange={(e) => setForm({...form, rate: e.target.value})}
              required
            />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full h-12 font-bold rounded-xl" disabled={loading}>
              {loading ? "Posting..." : "Post Job Offer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}