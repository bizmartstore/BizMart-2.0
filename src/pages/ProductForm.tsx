import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GenerateDescriptionButton from "../components/GenerateDescriptionButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface ProductFormProps {
  initialData?: {
    name?: string;
    price?: number;
    originalPrice?: number;
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
    originalPrice: initialData.originalPrice || '',
    category: initialData.category || '',
    stock: initialData.stock || 0,
    description: initialData.description || '',
    images: initialData.images || [],
  });

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || 0,
        originalPrice: initialData.originalPrice || '',
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
    setLoading(true);
        try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleDescriptionGenerated = (description: string) => {
    setFormData(prev => ({ ...prev, description }));
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
          <Label htmlFor="originalPrice">Original Price (₱)</Label>
          <Input            id="originalPrice"
            name="originalPrice"
            type="number"
            min="0"
            step="0.01"
            value={formData.originalPrice}
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

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Submitting...' : initialData.name ? 'Update Product' : 'Add Product'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel          </Button>
        )}
      </div>
    </form>
  );
}