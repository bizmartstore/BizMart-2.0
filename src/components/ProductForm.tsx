import { useState, useRef } from "react";
import GenerateDescriptionButton from "./GenerateDescriptionButton";

interface ProductFormProps {
  // Props passed from parent (e.g., initial values, submit handler, etc.)
  initialState: any;
  onSubmit: (data: any) => void;
  // Any other props you need (e.g., loading state, product to edit, etc.)
}

export default function ProductForm({ initialState, onSubmit }: ProductFormProps) {
  // Form state
  const [form, setForm] = useState({
    ...initialState,
    description: "", // description will be filled by the backend
  });
  const [description, setDescription] = useState("");

  // Handle the “Generate Description” button
  const handleGenerate = (productName: string) => {
    generateDescription(productName, (generated) => {
      setDescription(generated);
    });
  };

  const generateDescription = (productName: string, onFinished: (desc: string) => void) => {
    // Assuming GenerateDescriptionButton is imported above
    // It will call /api/generate-description and call onFinished with the result
    // We embed the button directly here for simplicity
    const button = (
      <GenerateDescriptionButton
        productName={productName}
        onDescriptionGenerated={onFinished}
        disabled={false}
      />
    );
    // Render the button + description textarea
    return (
      <div className="space-y-3">
        {/* Existing form fields (name, price, etc.) would be rendered here */}
        {/* ... existing inputs ... */}

        {/* Description field – pre‑filled with fallback */}
        <div>
          <Label className="text-[10px] font-bold">Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter product description..."
            className="w-full rounded-md border border-border p-2 text-sm"
          />
        </div>

        {/* Generate button */}
        <GenerateDescriptionButton
          productName={productName}
          onDescriptionGenerated={onFinished}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* Helper hook – you can also place this logic directly inside the form   */
/* --------------------------------------------------------------------- */
function useGenerateDescription(
  productName: string,
  onFinished: (desc: string) => void
) {
  const [loading, setLoading] = useState(false);
  const [fallback] = useState(
    "A high‑quality product that meets your needs and adds value to your collection."
  );

  const callBackend = async () => {
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      onFinished(json.description);
    } catch (e) {
      console.error("Backend description generation failed:", e);
      onFinished(fallback);
    } finally {
      setLoading(false);
    }
  };

  // Auto‑run when productName changes (optional)
  useEffect(() => {
    if (productName) {
      callBackend();
    }
  }, [productName, callBackend]);

  return { loading, fallbackDescription: fallback };
}