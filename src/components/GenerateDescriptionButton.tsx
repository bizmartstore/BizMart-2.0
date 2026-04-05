import { useState } from "react";

export default function GenerateDescriptionButton({
  productName,
  onDescriptionGenerated,
  disabled = false,
}: {
  productName: string;
  onDescriptionGenerated: (description: string) => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (disabled || !productName.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: productName.trim() }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate description');
      }

      onDescriptionGenerated(data.description);
    } catch (error) {
      console.error('Description generation failed:', error);
      // fallback to simple description
      onDescriptionGenerated('A high-quality product that meets your needs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generate}
      disabled={disabled || loading || !productName.trim()}
      className="flex items-center gap-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="mr-2">
            <span className="h-3.5 w-3.5 animate-spin">🔄</span>
          </span>
          <span>Generating...</span>
        </>
      ) : (
        <>
          <span className="mr-2">✨</span>
          <span>Generate Description</span>
        </>
      )}
    </button>
  );
};