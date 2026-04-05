import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2, Package, Upload, X } from "lucide-react";
import { GenerateDescriptionButton } from "../GenerateDescriptionButton";

interface ProductFormProps {
  initialData?: {
    name?: string;
    price?: number;
    original_price?: number;
    category?: string;
    stock?: number;
    description?: string;
    images?: string[];
  };
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

export default function ProductForm({ initialData = {}, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    price: initialData.price || 0,
    original_price: initialData.original_price || '',
    category: initialData.category || '',
    stock: initialData.stock || 0,
    description: initialData.description || '',
    images: initialData.images || [],
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || 0,
        original_price: initialData.original_price || '',
        category: initialData.category || '',
        stock: initialData.stock || 0,
        description: initialData.description || '',
        images: initialData.images || [],
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleDescriptionGenerated = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
  };

  const uploadImage = async (file: File) => {
    if (formData.images.length >= 3) {
      toast.error("Maximum 3 images allowed");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await fetch('/api/upload-image', {
        method: 'POST',
        body: file,
      });
      if (error) throw error;
      const { url } = await response.json();
      setFormData(f => ({ ...f, images: [...f.images, url] }));
      toast.success("Image uploaded!");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setFormData(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter product name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Price (₱) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="original_price">Original Price (₱)</Label>
          <Input
            id="original_price"
            name="original_price"
            type="number"
            min="0"
            step="0.01"
            value={formData.original_price}
            onChange={handleChange}
            placeholder="Optional - for showing discount"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="stock">Stock Quantity *</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Input
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          placeholder="e.g., notebooks, pens, tech"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter product description..."
          className="min-h-[120px]"
          required
        />
        <GenerateDescriptionButton
          productName={formData.name}
          onDescriptionGenerated={handleDescriptionGenerated}
          disabled={!formData.name.trim()}
        />
      </div>

      <div className="space-y-2">
        <Label>Product Images (up to 3)</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadImage(file);
          }}
        />
        <div className="flex gap-2">
          {formData.images.map((url, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {formData.images.length < 3 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
              <span className="text-[8px] text-muted-foreground">{uploading ? "..." : "Add"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Submitting...' : initialData.name ? 'Update Product' : 'Add Product'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}