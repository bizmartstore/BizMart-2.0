import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Info, ShieldAlert, Clock, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  { id: "homework", name: "Homework Guidance", min: 50, max: 150, icon: "📝" },
  { id: "study", name: "Study Assistance", min: 50, max: 120, icon: "📖" },
  { id: "tutoring", name: "Subject Tutoring", min: 60, max: 200, icon: "👨‍🏫" },
  { id: "presentation", name: "Presentation Coaching", min: 70, max: 180, icon: "📊" },
  { id: "project", name: "Project Idea Help", min: 70, max: 200, icon: "💡" },
  { id: "editing", name: "Editing Guidance", min: 80, max: 220, icon: "✍️" },
  { id: "skills", name: "Academic Skill Support", min: 80, max: 250, icon: "🎯" },
  { id: "creative", name: "Creative Academic Assistance", min: 80, max: 250, icon: "🎨" },
];

const DIFFICULTY_LEVELS = [
  { id: "easy", name: "Easy", multiplier: 1.0 },
  { id: "medium", name: "Medium", multiplier: 1.2 },
  { id: "hard", name: "Hard", multiplier: 1.5 },
];

export default function JobPostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    difficulty: "medium",
    budget: "",
    neededDate: today,
    neededTime: "",
  });

  const selectedCat = CATEGORIES.find(c => c.id === form.category);
  const selectedDiff = DIFFICULTY_LEVELS.find(d => d.id === form.difficulty);
  const minPrice = selectedCat ? Math.ceil(selectedCat.min * (selectedDiff?.multiplier || 1)) : 50;
  const maxPrice = selectedCat ? Math.ceil(selectedCat.max * (selectedDiff?.multiplier || 1)) : 300;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const budget = Number(form.budget);
    if (budget < minPrice) {
      toast.error(`Minimum budget for this category & difficulty is ₱${minPrice}`);
      return;
    }
    if (budget > maxPrice) {
      toast.error(`Maximum budget for this category is ₱${maxPrice}`);
      return;
    }
    if (!form.neededTime) {
      toast.error("Please select when you need the service.");
      return;
    }

    // Combine date and time, then validate it's in the future
    const neededDateTime = new Date(`${form.neededDate}T${form.neededTime}`);
    const now = new Date();
    
    if (neededDateTime <= now) {
      toast.error("The needed time must be in the future.");
      return;
    }

    // Job expires 10 minutes after the declared needed time
    const expiresAt = new Date(neededDateTime.getTime() + 10 * 60 * 1000).toISOString();

    setLoading(true);
    try {
      const { error } = await (supabase as any).from("job_postings").insert({
        client_id: user.id,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        hourly_rate: budget,
        min_price: minPrice,
        max_price: maxPrice,
        difficulty_level: form.difficulty,
        escrow_amount: budget,
        status: "open",
        expires_at: expiresAt,
      });

      if (error) {
        console.error("Supabase Job Post Error:", error);
        throw error;
      }

      toast.success("Job offer posted successfully! 🎓 Freelancers can now bid.");
      navigate("/jobs");
    } catch (err: any) {
      console.error("Failed to post job:", err);
      toast.error(err.message || "Failed to post job. Check console for details.");
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
            <span className="font-bold text-xs text-amber-700">Academic Integrity & Escrow</span>
          </div>
          <p className="text-[10px] text-amber-700 leading-relaxed">
            Freelancers are only allowed to **guide and tutor**. Payment is held in escrow and released after session completion. Jobs expire 10 minutes after your declared service time.
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
                    {cat.icon} {cat.name} (₱{cat.min}-₱{cat.max})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Difficulty Level</Label>
            <Select onValueChange={(v) => setForm({...form, difficulty: v})} value={form.difficulty}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} (×{d.multiplier} price)
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
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Meeting Location (On Campus)
            </Label>
            <Input 
              placeholder="e.g. Library, Study Area, BizMart Store" 
              value={form.location}
              onChange={(e) => setForm({...form, location: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Date Needed
              </Label>
              <Input 
                type="date"
                value={form.neededDate}
                onChange={(e) => setForm({...form, neededDate: e.target.value})}
                min={today}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Time Needed
              </Label>
              <Input 
                type="time"
                value={form.neededTime}
                onChange={(e) => setForm({...form, neededTime: e.target.value})}
                required
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold">Budget (₱)</Label>
              {form.category && (
                <span className="text-[10px] text-muted-foreground">Min: ₱{minPrice} · Max: ₱{maxPrice}</span>
              )}
            </div>
            <Input 
              type="number" 
              placeholder={`₱${minPrice} - ₱${maxPrice}`}
              value={form.budget}
              onChange={(e) => setForm({...form, budget: e.target.value})}
              required
            />
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Job expires 10 mins after your selected time
            </p>
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