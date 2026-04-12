"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCategories } from "@/hooks/useProducts";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface CategoryHighlightSectionProps {
  title?: string;
  subtitle?: string;
}

export default function CategoryHighlightSection({
  title = "📂 Explore Categories",
  subtitle = "Find what you need in seconds"
}: CategoryHighlightSectionProps) {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useCategories();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Get top 8 categories
  const featuredCategories = categories.slice(0, 8);

  if (isLoading) {
    return (
      <div className="px-3 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📂</span>
          <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">Explore Categories</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border animate-pulse">
              <div className="h-12 bg-muted rounded-lg mb-2"></div>
              <div className="h-2 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="px-3 mt-6">
      <div className="flex items-center justify-between mb-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <span className="text-lg">📂</span>
          <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">{title.replace("📂", "").trim()}</span>
        </motion.div>
        <button
          onClick={() => navigate("/categories")}
          className="text-xs text-secondary font-bold flex items-center gap-1 hover:text-secondary/80 transition-colors"
        >
          See All <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-4 gap-2"
      >
        {featuredCategories.map((category) => (
          <motion.button
            key={category.id}
            whileHover={{ y: -5, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/categories?selected=${category.id}`)}
            className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all"
            onMouseEnter={() => setHoveredCategory(category.id)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <motion.div
              animate={{ rotate: hoveredCategory === category.id ? [0, 5, 0] : 0 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center"
            >
              <span className="text-2xl">{category.icon}</span>
            </motion.div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[10px] font-bold text-foreground text-center leading-tight"
            >
              {category.name}
            </motion.span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}