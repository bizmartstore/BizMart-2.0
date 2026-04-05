import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GenerateDescriptionButton from "./GenerateDescriptionButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

// Assuming you already have a form with fields like name, price, etc.
// Below is a minimal example; adapt field names to match your existing form.

export default function ProductForm({ initialValues, onSubmit }: any) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialValues);
  const [description, setDescription] = useState("");

  // When the user clicks “Generate Description”, fill the description field
  const handleGenerate = (productName: string) => {
    const button = document.querySelector("GenerateDescriptionButton") as any;
    if (button) {
      const btn = button as any;
      btn.disabled = true;
      generateDescription(productName, (generatedDesc: string) => {
        setDescription(generatedDesc);
        button.disabled = false;
      });
    });
  };

  const generateDescription = async (productName: string, onFinished: (desc: string) => void) => {
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      onFinished(json.description);
    } catch (err) {
      console.error("Description generation failed:", err);
      onFinished("A high‑quality product that meets your needs and adds value to your collection.");
    }
  };

  // Render the form (simplified example)
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      // Optionally call an existing submit handler here
      await onSubmit(form);
      navigate("/products"); // or wherever you want after submit
    }>
      {/* Existing fields (name, price, etc.) – keep them as‑is */}
      {/* ... */}

      {/* Description field – now auto‑filled */}
      <div>
        <Label className="text-[10px] font-bold">Description</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter product description..."
          className="w-full rounded-md border border-border p-2 text-sm"
        />
      </div>

      {/* Generate Description button */}
      <GenerateDescriptionButton
        productName={form.name}
        onDescriptionGenerated={(desc) => setDescription(desc)}
      />

      {/* Submit button */}
      <Button type="submit" className="w-full h-12 font-bold rounded-xl" disabled={loading}>
        {loading ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}