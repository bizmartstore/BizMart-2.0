import { useProducts, useCategories } from "@/hooks/useProducts";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import BottomNav from "@/components/BottomNav";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  const initialCat = searchParams.get("selected") || (categories[0]?.id || "notebooks");
  const [selected, setSelected] = useState(initialCat);

  useEffect(() => {
    const cat = searchParams.get("selected");
    if (cat) setSelected(cat);
  }, [searchParams]);

  // Robust filtering: case-insensitive, trimmed, handles undefined
  const filtered = products.filter(p => {
    const pCat = (p.category || "").toLowerCase().trim();
    const sCat = (selected || "").toLowerCase().trim();
    return pCat === sCat;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-sm ml-2">Categories</span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-20 bg-card border-r border-border min-h-[calc(100vh-3.5rem-3.5rem)] overflow-y-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className={`w-full py-3 flex flex-col items-center gap-1 text-center transition-colors ${
                selected === cat.id
                  ? "bg-accent border-l-2 border-primary"
                  : ""
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="text-[10px] leading-tight font-medium px-1">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="flex-1 p-2">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground text-sm">No products in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}