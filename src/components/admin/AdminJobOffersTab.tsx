import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, RefreshCw, Users, Clock, CheckCircle2, X, Package, MapPin, Timer } from "lucide-react";

export default function AdminJobOffersTab() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    job_type: "tutoring",
    location: "",
    reward: 50,
    duration_minutes: 60,
    required_skills: [] as string[],
    max_applicants: 1,
  });
  const [skillInput, setSkillInput] = useState("");

  const loadData = async () => {
    const [jobsData, sessionsData] = await Promise.all([
      supabase
        .from("job_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("job_sessions")
        .select(`
          *,
          job_request:job_requests(title),
          assistant:profiles(first_name, last_name, email)
        `)
        .order("started_at", { ascending: false }),
    ]);

    setJobs(jobsData.data || []);
    setSessions(sessionsData.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      job_type: "tutoring",
      location: "",
      reward: 50,
      duration_minutes: 60,
      required_skills: [],
      max_applicants: 1,
    });
    setEditingJob(null);
    setShowForm(false);
    setSkillInput("");
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingJob) {
        const { error } = await supabase
          .from("job_requests")
          .update({
            title: form.title.trim(),
            description: form.description.trim(),
            job_type: form.job_type,
            location: form.location.trim(),
            reward: form.reward,
            duration_minutes: form.duration_minutes,
            required_skills: form.required_skills,
            max_applicants: form.max_applicants,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingJob.id);

        if (error) throw error;
        toast.success("Job updated successfully!");
      } else {
        const { error } = await supabase
          .from("job_requests")
          .insert({
            title: form.title.trim(),
            description: form.description.trim(),
            job_type: form.job_type,
            location: form.location.trim(),
            reward: form.reward,
            duration_minutes: form.duration_minutes,
            required_skills: form.required_skills,
            max_applicants: form.max_applicants,
            posted_by: user?.id,
            status: "open",
            current_applicants: 0,
          });

        if (error) throw error;
        toast.success("Job posted successfully!");
      }

      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save job");
    }
  };

  const handleEdit = (job: any) => {
    setForm({
      title: job.title,
      description: job.description,
      job_type: job.job_type,
      location: job.location,
      reward: job.reward,
      duration_minutes: job.duration_minutes,
      required_skills: job.required_skills || [],
      max_applicants: job.max_applicants,
    });
    setEditingJob(job);
    setShowForm(true);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const { error } = await supabase
        .from("job_requests")
        .delete()
        .eq("id", jobId);

      if (error) throw error;
      toast.success("Job deleted successfully!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete job");
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("job_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) throw error;
      toast.success("Session completed! Earnings will be processed.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete session");
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("job_sessions")
        .update({ status: "cancelled" })
        .eq("id", sessionId);

      if (error) throw error;
      toast.success("Session cancelled");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel session");
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !form.required_skills.includes(skillInput.trim())) {
      setForm({
        ...form,
        required_skills: [...form.required_skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setForm({
      ...form,
      required_skills: form.required_skills.filter((s) => s !== skill),
    });
  };

  const jobTypeOptions = [
    { value: "tutoring", label: "Tutoring" },
    { value: "event_help", label: "Event Help" },
    { value: "delivery", label: "Delivery" },
    { value: "tech_support", label: "Tech Support" },
    { value: "errand", label: "Errand" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Job Offers Management</h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Post New Job"}
        </Button>
      </div>

      {/* Job Creation Form */}
      {showForm && (
        <div className="bg-card rounded-xl p-4 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">
              {editingJob ? "Edit Job" : "Create New Job"}
            </h4>
            <button onClick={resetForm}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Job Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Math Tutor Needed"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Job Type *</Label>
              <Select
                value={form.job_type}
                onValueChange={(value) => setForm({ ...form, job_type: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the job requirements and responsibilities..."
              className="text-sm"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Location *</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Library, Room 201"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Duration (minutes) *</Label>
              <Input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Reward (BCoins) *</Label>
              <Input
                type="number"
                value={form.reward}
                onChange={(e) => setForm({ ...form, reward: Number(e.target.value) })}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max Applicants</Label>
              <Input
                type="number"
                value={form.max_applicants}
                onChange={(e) => setForm({ ...form, max_applicants: Number(e.target.value) })}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Required Skills</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill..."
                className="text-sm"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill} size="sm" variant="outline">
                Add
              </Button>
            </div>
            {form.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} size="sm" className="flex-1">
              {editingJob ? "Update Job" : "Post Job"}
            </Button>
            <Button onClick={resetForm} size="sm" variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Active Sessions */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Active Sessions ({sessions.filter(s => s.status === 'accepted' || s.status === 'in_progress').length})
        </h4>
        {sessions.filter(s => s.status === 'accepted' || s.status === 'in_progress').length > 0 ? (
          <div className="space-y-2">
            {sessions
              .filter(s => s.status === 'accepted' || s.status === 'in_progress')
              .map((session) => (
                <div key={session.id} className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">{session.job_request?.title || "Job"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {session.assistant?.first_name} {session.assistant?.last_name} • {session.assistant?.email}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                      session.status === 'accepted'
                        ? 'bg-warning/20 text-warning'
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {session.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {session.status === 'accepted' && (
                      <Button
                        onClick={() => handleCompleteSession(session.id)}
                        size="sm"
                        className="gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Start Work
                      </Button>
                    )}
                    {session.status === 'in_progress' && (
                      <Button
                        onClick={() => handleCompleteSession(session.id)}
                        size="sm"
                        className="gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Complete
                      </Button>
                    )}
                    <Button
                      onClick={() => handleCancelSession(session.id)}
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-card rounded-xl border border-border">
            <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No active sessions</p>
          </div>
        )}
      </div>

      {/* Job Requests List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            All Job Requests ({jobs.length})
          </h4>
          <Button onClick={loadData} size="sm" variant="outline" className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
        {jobs.length > 0 ? (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="bg-card rounded-xl p-3 border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs mb-1">{job.title}</h5>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2">
                    <span className="text-sm font-bold text-primary">{job.reward} BCoins</span>
                    <span className="text-[9px] text-muted-foreground">{job.duration_minutes} min</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {job.job_type.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] bg-muted text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                  <span className={`text-[9px] px-2 py-1 rounded-full ${
                    job.status === 'open'
                      ? 'bg-success/20 text-[hsl(var(--success))]'
                      : job.status === 'filled'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {job.status}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {job.current_applicants}/{job.max_applicants} applicants
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleEdit(job)}
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(job.id)}
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No job requests created yet</p>
            <Button onClick={() => setShowForm(true)} size="sm" className="mt-3 gap-1">
              <Plus className="h-3 w-3" />
              Create First Job
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}