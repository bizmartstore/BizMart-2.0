import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, Star, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJob = async () => {
      const { data } = await (supabase as any)
        .from("job_postings")
        .select("*, client:profiles!job_postings_client_id_fkey(*)")
        .eq("id", id)
        .maybeSingle();
      setJob(data);
      setLoading(false);
    };
    loadJob();
  }, [id]);

  const handleApply = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    toast.success("Application submitted! (Feature coming soon)");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Job not found</p>
        <Button onClick={() => navigate("/jobs")}>Back to Jobs</Button>
      </div>
    );
  }

  const isExpired = new Date(job.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-sm ml-2">Job Details</span>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {job.category}
            </span>
            {isExpired ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
                EXPIRED
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                OPEN
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold leading-tight mb-2">{job.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>4.8</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>₱{job.hourly_rate}/hr</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-bold text-sm mb-2">Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {job.description}
          </p>
        </div>

        {/* Client Info */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-bold text-sm mb-3">Client</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold">
                {job.client?.first_name?.[0]}{job.client?.last_name?.[0]}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm">
                {job.client?.first_name} {job.client?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{job.client?.email}</p>
            </div>
          </div>
        </div>

        {/* Expiry */}
        <div className="bg-muted/30 rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Expires</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(job.expires_at).toLocaleDateString()} at{" "}
            {new Date(job.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleApply}
          disabled={isExpired}
          className="w-full h-12 font-bold rounded-xl"
        >
          {isExpired ? "Job Expired" : "Apply for This Job"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By applying, you agree to our Academic Integrity Policy. Freelancers must only guide and tutor.
        </p>
      </div>
    </div>
  );
}