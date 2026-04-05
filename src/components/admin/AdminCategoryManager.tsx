"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Edit2, Trash2, Loader2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
};

export default function AdminCategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any).from("categories").select("*").order("sort_order");
      if (error) throw error;
      setCategories(data || []);
    } catch (e: any) {
      console.error("Failed to load categories:", e);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const { error } = await (supabase as any).from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Category deleted");
      loadCategories();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setNewCategoryName(category.name);
  };

  const handleSave = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await (supabase as any).from("categories").update({ name: newCategoryName }).eq("id", editingId);
        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await (supabase as any).from("categories").insert({ name: newCategoryName, sort_order: categories.length });
        if (error) throw error;
        toast.success("Category added");
      }
      setNewCategoryName("");
      setEditingId(null);
      loadCategories();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Input
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="flex-1 text-sm rounded-md border border-border px-3 py-2"
        />
        <Button onClick={() => handleSave()} disabled={saving} className="flex-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : editingId ? "Update" : "Add"}
        </Button>
        {editingId && (
          <Button variant="outline" onClick={() => {
            setEditingId(null);
            setNewCategoryName("");
          }}
            className="flex-1 rounded-md text-sm"
          >
            Cancel
          </Button>
        )}
      </div>
      {categories.length > 0 && (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-card rounded-lg p-3 border border-border flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                <span className="h-5 w-5 text-primary">{cat.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{cat.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="text-primary hover:text-primary/90"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}