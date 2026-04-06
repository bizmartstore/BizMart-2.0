import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Info, ShieldAlert, Clock, MapPin, Calendar, ListChecks, Target, FileText, Timer } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendNotification } from "@/lib/notifications";

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
    hourlyRate: "",
    durationHours: "1",
    neededDate: today,
    neededTime: "",
    instructions: "",
    expectedOutput: "",
    requirements: "",
  });

  const selectedCat = CATEGORIES.find(c => c.id === form.category);
  const selectedDiff = DIFFICULTY_LEVELS.find(d => d.id === form.difficulty);
  const minRate = selectedCat ? Math.ceil(selectedCat.min * (selectedDiff?.multiplier || 1)) : 50;
  const maxRate = selectedCat ? Math.ceil(selectedCat.max * (selectedDiff?.multiplier || 1)) : 300;

  const totalPayment = Number(form.hourlyRate) * Number(form.durationHours);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const rate = Number(form.hourlyRate);
    if (rate < minRate) {
      toast.error(`Minimum hourly rate for this category is ₱${minRate}`);
      return;
    }
    if (rate > maxRate) {
      toast.error(`Maximum hourly rate for this category is ₱${maxRate}`);
      return;
    }
    if (!form.neededTime) {
      toast.error("Please select when you need the service.");
      return;
    }

    const neededDateTime = new Date(`${form.neededDate}T${form.neededTime}`);
    const now = new Date();
    
    if (neededDateTime <= now) {
      toast.error("The needed time must be in the future.");
      return;
    }

    const expiresAt = new Date(neededDateTime.getTime() + 10 * 60 * 1000).toISOString();

    setLoading(true);
    try {
      const { error } = await (supabase as any).from("job_postings").insert({
        client_id: user.id,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        hourly_rate: rate,
        duration_hours: Number(form.durationHours),
        min_price: minRate,
        max_price: maxRate,
        difficulty_level: form.difficulty,
        escrow_amount: totalPayment,
        status: "pending_payment",
        expires_at: expiresAt,
        instructions: form.instructions.trim(),
        expected_output: form.expectedOutput.trim(),
        requirements: form.requirements.trim(),
      });

      if (error) throw error;

      toast.success(`Job posted! Total payment: ₱${totalPayment}. Please proceed to BizMart staff.`);
      navigate("/jobs");
    } catch (err: any) {
      console.error("Failed to post job:", err);
      toast.error(err.message || "Failed to post job.");
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
            <span className="font-bold text-xs text-amber-700">Escrow Payment Required</span>
          </div>
          <p className="text-[10px] text-amber-700 leading-relaxed">
            Payment will be securely held by the admin as an escrow. Total payment is calculated as: <strong>Hourly Rate × Duration</strong>.
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Category</Label>
              <Select onValueChange={(v) => setForm({...form, category: v})}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Difficulty</Label>
              <Select onValueChange={(v) => setForm({...form, difficulty: v})} value={form.difficulty}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Hourly Rate (₱)</Label>
              <Input 
                type="number" 
                placeholder={`₱${minRate}-₱${maxRate}`}
                value={form.hourlyRate}
                onChange={(e) => setForm({...form, hourlyRate: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Duration (Hours)</Label>
              <Select onValueChange={(v) => setForm({...form, durationHours: v})} value={form.durationHours}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="2">2 Hours</SelectItem>
                  <SelectItem value="3">3 Hours</SelectItem>
                  <SelectItem value="4">4 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground">Total Escrow Payment:</span>
            <span className="text-lg font-extrabold text-primary">₱{totalPayment || 0}</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Description</Label>
            <Textarea 
              placeholder="Briefly describe what you need help with..." 
              className="min-h-[80px] rounded-xl"
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-primary" /> Step-by-Step Instructions
            </Label>
            <Textarea 
              placeholder="1. Start by... 2. Then..." 
              className="min-h-[100px] rounded-xl"
              value={form.instructions}
              onChange={(e) => setForm({...form, instructions: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" /> Expected Output
            </Label>
            <Textarea 
              placeholder="Describe the final deliverable..." 
              className="min-h-[80px] rounded-xl"
              value={form.expectedOutput}
              onChange={(e) => setForm({...form, expectedOutput: e.target.value})}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Meeting Location
            </Label>
            <Input 
              placeholder="e.g. Library, Study Area" 
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
              />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full h-12 font-bold rounded-xl" disabled={loading}>
              {loading ? "Posting..." : "Submit for Escrow Payment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}