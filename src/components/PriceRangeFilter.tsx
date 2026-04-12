"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

interface PriceRangeFilterProps {
  minPrice: number;
  maxPrice: number;
  onRangeChange: (min: number, max: number) => void;
  currentMin: number;
  currentMax: number;
}

export default function PriceRangeFilter({
  minPrice,
  maxPrice,
  onRangeChange,
  currentMin,
  currentMax
}: PriceRangeFilterProps) {
  const [range, setRange] = useState([currentMin, currentMax]);

  useEffect(() => {
    setRange([currentMin, currentMax]);
  }, [currentMin, currentMax]);

  const handleValueChange = (value: number[]) => {
    setRange(value);
    onRangeChange(value[0], value[1]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-card rounded-xl border border-border p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">💰</span>
        <div>
          <h3 className="font-bold text-sm">Price Range</h3>
          <p className="text-[10px] text-muted-foreground">Filter by price</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold">
          <span>₱{range[0]}</span>
          <span>₱{range[1]}</span>
        </div>

        <Slider
          defaultValue={[currentMin, currentMax]}
          min={minPrice}
          max={maxPrice}
          step={5}
          value={range}
          onValueChange={handleValueChange}
          className="h-2"
        />

        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Min</span>
          <span>Max</span>
        </div>
      </div>
    </motion.div>
  );
}