import { useState, useEffect } from "react";

interface Props {
  productName: string;
  onDescriptionGenerated: (description: string) => void;
  disabled?: boolean;
}

export default function GenerateDescriptionButton({ productName, onDescriptionGenerated, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [fallbackDescription, setFallbackDescription] = useState(
    "A high‑quality product that meets your needs and adds value to your collection."
  );

  // Fetch generated description from the backend
  const generate = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      onDescriptionGenerated(json.description);
    } catch (err) {
      console.error("Description generation failed:", err);
      onDescriptionGenerated(fallbackDescription);
    } finally {
      setLoading(false);
    }
  };

  // Auto‑focus the textarea when the component mounts (optional)
  useEffect(() => {
    // No extra logic needed – the button handles the flow.
  }, []);

  return (
    <div className="mt-2">
      <button
        onClick={generate}
        disabled={disabled || loading}
        className="rounded bg-primary text-primary-foreground px-3 py-1.5 font-semibold hover:bg-primary/90 transition-colors"
      >
        {loading ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </span>
        ) : (
          <span className="font-medium">Generate Description</span>
        </button>
      </div>

      {/* Fallback description preview (read‑only) */}
      {fallbackDescription && (
        <p className="mt-1 text-[10px] text-muted-foreground italic">
          (Fallback description will appear if generation fails)
        </p>
      )}
    </div>
  );
}