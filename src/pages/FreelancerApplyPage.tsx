// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // freelancer_profiles uses user_id as foreign key
      const { error } = await supabase
        .from("freelancer_profiles")
        .insert({
          user_id: user.id, // Use user_id here
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

// ... (rest of component)