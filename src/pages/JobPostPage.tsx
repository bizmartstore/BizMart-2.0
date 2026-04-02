// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (Number(form.rate) < minRate) {
      toast.error(`Minimum rate for this category is ₱${minRate}`);
      return;
    }

    setLoading(true);
    try {
      // job_postings uses client_id as foreign key to profiles
      const { error } = await supabase
        .from("job_postings")
        .insert({
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

// ... (rest of component)