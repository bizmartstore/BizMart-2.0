import { useState } from "react";
import { Loader2 } from "lucide-react";

interface GenerateDescriptionButtonProps {
  productName: string;
  onDescriptionGenerated: (description: string) => void;
  disabled?: boolean;
}

export default function GenerateDescriptionButton({
  productName,
  onDescriptionGenerated,
  disabled = false
}: GenerateDescriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const fallbackDescription = "A high-quality product that meets your needs and adds value to your collection.";

  const generate = async () => {
    if (disabled || !productName.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productName: productName.trim() }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate description');
      }

      onDescriptionGenerated(data.description);
    } catch (error) {
      console.error('Description generation failed:', error);
      onDescriptionGenerated(fallbackDescription);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={generate}
        disabled={disabled || loading || !productName.trim()}
        className="rounded bg-primary text-primary-foreground px-3 py-1.5 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </span>
        ) : (
          <span className="font-medium">Generate Description</span>
        )}
      </button>
    </div>
  );
}