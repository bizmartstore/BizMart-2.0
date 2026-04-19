"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Copy } from "lucide-react";

interface POSProductCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  price: number;
  onClick: () => void;
  isSelected: boolean;
}

export default function POSProductCard({ icon, title, description, price, onClick, isSelected }: POSProductCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">{icon}</div>
        <div className="flex-1">
          <h3 className="font-bold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold text-primary">₱{price.toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );
}
