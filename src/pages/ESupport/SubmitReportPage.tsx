"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Shield, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { notifyAdminNewReport } from "@/lib/notifications";

type ReportType = "bullying" | "misconduct" | "safety" | "discrimination" | "mental_health" | "other";

const reportTypes: { value: ReportType; label: string; description: string }[] = [
  {
    value: "bullying",
    label: "Bullying/Harassment",
    description: "Physical, verbal, or online bullying by students or staff"
  },
  {
    value: "misconduct",
    label: "Misconduct",
    description: "Inappropriate behavior by students or staff"
  },
  {
    value: "safety",
    label: "Safety Concern",
    description: "Threats, violence, or dangerous situations"
  },
  {
    value: "discrimination",
    label: "Discrimination",
    description: "Racism, sexism, or other unfair treatment"
  },
  {
    value: "mental_health",
    label: "Mental Health",
    description: "Stress, anxiety, depression, or self-harm concerns"
  },
  {
    value: "other",
    label: "Other Issue",
    description: "Any other serious concern not listed above"
  }
];

export default function SubmitReportPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    type: "bullying" as ReportType,
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    isAnonymous: false,
    reporterName: "",
    reporterContact: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error("Please login to submit a report");
      navigate("/login");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      // Generate unique tracking ID
      const trackingId = `REP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Prepare report data
const reportData = {
  incident_type: form.type,
  title: form.title.trim(),
  description: form.description.trim(),
  location: form.location.trim(),

  // ✅ FIXED: match your DB column
  incident_date: form.date || null,
  is_anonymous: form.isAnonymous,
  reporter_name: form.isAnonymous ? "Anonymous" : form.reporterName.trim(),
  reporter_contact: form.isAnonymous ? "Anonymous" : form.reporterContact.trim(),

  status: "pending",
  tracking_id: trackingId,
  user_id: user.id,
  created_at: new Date().toISOString(),
  severity: "medium"
};
      // Insert into database
      const { error } = await (supabase as any)
        .from("support_reports")
        .insert(reportData);

      if (error) throw error;

      // Send notification to admin
      const reporterName = form.isAnonymous ? "Anonymous Student" : `${profile?.first_name || ""} ${profile?.last_name || ""}`;
      await notifyAdminNewReport(reporterName, form.title, trackingId);

      // Set success state
      setTrackingId(trackingId);
      setSuccess(true);

      toast.success("Report submitted successfully!");

    } catch (err: any) {
      console.error("Failed to submit report:", err);
      toast.error("Failed to submit report: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      type: "bullying",
      title: "",
      description: "",
      location: "",
      date: "",
      time: "",
      isAnonymous: false,
      reporterName: "",
      reporterContact: ""
    });
    setSuccess(false);
    setTrackingId(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Please Login</h2>
        <p className="text-muted-foreground mb-6">You need to be logged in to submit a report.</p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-extrabold mb-2">Report Submitted Successfully!</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Thank you for submitting your report. Our guidance office will review it shortly.
              </p>
            </div>

            <Card className="border border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Your Report Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Tracking ID</p>
                  <p className="text-sm font-mono font-bold text-foreground">{trackingId}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Report Type</p>
                  <p className="text-sm font-bold">
                    {reportTypes.find(t => t.value === form.type)?.label}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title</p>
                  <p className="text-sm">{form.title}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</p>
                  <p className="text-sm text-muted-foreground">{form.description}</p>
                </div>

                {!form.isAnonymous && (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Name</p>
                      <p className="text-sm">{form.reporterName}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact</p>
                      <p className="text-sm">{form.reporterContact}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="mt-6 space-y-3">
              <Button
                onClick={() => navigate("/e-support/track")}
                className="w-full h-12 font-bold rounded-xl gap-2"
              >
                <Eye className="h-4 w-4" />
                Track My Report
              </Button>

              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full h-12 font-bold rounded-xl gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Submit Another Report
              </Button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate(-1)} className="p-1.5">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Submit Report</h1>
            <p className="text-xs text-muted-foreground">Confidential reporting to guidance office</p>
          </div>
        </div>

        <Card className="border border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Report Form
            </CardTitle>
            <CardDescription>
              Fill out this form to submit a confidential report to our guidance office.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Report Type */}
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center gap-1">
                  Report Type <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {reportTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: type.value }))}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        form.type === type.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <p className="text-xs font-bold text-foreground">{type.label}</p>
                      <p className="text-[10px] text-muted-foreground">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1">
                  Report Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Brief description of the incident"
                  required
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1">
                  Detailed Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What happened? Who was involved? When and where did it occur?"
                  rows={4}
                  required
                  className="rounded-xl"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Location of Incident</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g., Main Building, 2nd Floor, Room 201"
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Date (Optional)</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Time (Optional)</Label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Anonymous Option */}
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isAnonymous}
                    onChange={(e) => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
                    className="rounded border-primary text-primary focus:ring-primary"
                  />
                  Submit Anonymously
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  {form.isAnonymous
                    ? "Your identity will be kept completely confidential."
                    : "Your name and contact will be visible to guidance counselors only."
                  }
                </p>
              </div>

              {/* Reporter Information (shown only if not anonymous) */}
              {!form.isAnonymous && (
                <div className="space-y-3 p-3 border border-border rounded-lg">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Your Information (Optional)
                  </p>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Full Name</Label>
                    <Input
                      value={form.reporterName}
                      onChange={(e) => setForm(f => ({ ...f, reporterName: e.target.value }))}
                      placeholder="Your full name"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1">
                      Contact Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.reporterContact}
                      onChange={(e) => setForm(f => ({ ...f, reporterContact: e.target.value }))}
                      placeholder="Your phone number or email"
                      required
                      className="h-10 rounded-xl pr-10"
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
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 font-bold rounded-xl gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Submit Confidential Report
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-yellow-800 dark:text-yellow-200 mb-1">Important Notice</h3>
            <p className="text-sm text-muted-foreground">
              If you are in immediate danger, please contact emergency services or a trusted adult immediately.
              This form is for non-emergency reporting.
            </p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}