import { Search, ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import BottomNav from "@/components/BottomNav";

const popularSearches = ["Notebook", "Pen", "Calculator", "Backpack", "Art supplies", "Dictionary"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();

  const results = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search school supplies..."
            className="bg-transparent text-sm flex-1 outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {!query.trim() ? (
        <div className="px-4 py-4">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Popular Searches</p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="bg-muted px-3 py-1.5 rounded-full text-xs font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground text-sm">No results for "{query}"</p>
        </div>
      ) : (
        <div className="p-3 grid grid-cols-2 gap-2">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
