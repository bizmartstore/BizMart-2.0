"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShieldAlert, ArrowLeft, CheckCircle2, Upload, Loader2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const INCIDENT_TYPES = [
  "Bullying",
  "Harassment",
  "Physical Misconduct",
  "Safety Threat",
  "Mental Health Concern",
  "Academic Dishonesty",
  "Other"
];

export default function ESumbongPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    incidentType: "",
    description: "",
    date: "",
    location: "",
    peopleInvolved: "",
    isAnonymous: false,
  });

  const handleSubmit = async () => {
    if (!form.incidentType || !form.description) {
      toast.error("Please fill in the required fields.");
      return;
    }

    setLoading(true);
    try {
      const tid = `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error } = await (supabase as any).from("support_reports").insert({
        tracking_id: tid,
        user_id: form.isAnonymous ? null : user?.id,
        incident_type: form.incidentType,
        description: form.description,
        incident_date: form.date || new Date().toISOString(),
        location: form.location,
        people_involved: form.peopleInvolved,
        is_anonymous: form.isAnonymous,
        status: 'pending',
        severity: 'medium'
      });

      if (error) throw error;
      setTrackingId(tid);
      setStep(3);
      toast.success("Report submitted successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="px-6 py-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black mb-2">Report Submitted</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Thank you for speaking up. Your report has been received and will be reviewed by the guidance office.
          </p>
          
          <div className="bg-muted rounded-2xl p-6 mb-8 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Your Tracking ID</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-mono font-black text-primary">{trackingId}</span>
              <button onClick={() => {
                navigator.clipboard.writeText(trackingId || "");
                toast.success("ID copied!");
              }} className="p-2 hover:bg-background rounded-lg transition-colors">
                <Copy className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4">
              Save this ID to track the status of your report.
            </p>
          </div>

          <Button onClick={() => navigate("/e-support")} className="w-full h-12 rounded-xl font-bold">
            Back to Support Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="font-extrabold text-lg">Submit a Report</h1>
      </div>

      <div className="px-4 py-6">
        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-red-600' : 'bg-muted'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-red-600' : 'bg-muted'}`} />
        </div>

        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Incident Type *</Label>
              <Select onValueChange={(v) => setForm({...form, incidentType: v})}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Detailed Description *</Label>
              <Textarea 
                placeholder="Tell us what happened..." 
                className="rounded-xl min-h-[120px]"
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold">Report Anonymously</Label>
                <p className="text-[10px] text-muted-foreground">Your identity will not be stored.</p>
              </div>
              <Switch 
                checked={form.isAnonymous} 
                onCheckedChange={(v) => setForm({...form, isAnonymous: v})} 
              />
            </div>

            <Button onClick={() => setStep(2)} className="w-full h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700">
              Next Step
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Date of Incident</Label>
                <Input 
                  type="date" 
                  className="h-11 rounded-xl"
                  value={form.date}
                  onChange={(e) => setForm({...form, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Location</Label>
                <Input 
                  placeholder="e.g. Cafeteria" 
                  className="h-11 rounded-xl"
                  value={form.location}
                  onChange={(e) => setForm({...form, location: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">People Involved (Optional)</Label>
              <Input 
                placeholder="Names or descriptions" 
                className="h-11 rounded-xl"
                value={form.peopleInvolved}
                onChange={(e) => setForm({...form, peopleInvolved: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Evidence (Images/Docs)</Label>
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">Tap to upload screenshots or photos</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl font-bold">
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-[2] h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Report
              </Button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}