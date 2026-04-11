"use client";

import { Store, Disc } from "lucide-react";

interface BCoinsFeaturesProps {
  activeSection: string | null;
  onSectionChange: (section: string | null) => void;
}

const features = [
  { 
    id: "store", 
    label: "BCoins Store", 
    bg: "bg-gradient-to-br from-emerald-500 to-teal-500", 
    icon: Store,
    desc: "Redeem GCash"
  },
  { 
    id: "spin", 
    label: "Spin the Wheel", 
    bg: "bg-gradient-to-br from-purple-500 to-pink-500", 
    icon: Disc,
    desc: "Win BCoins"
  },
];

export default function BCoinsFeatures({ activeSection, onSectionChange }: BCoinsFeaturesProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✨</span>
        <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">BCoins Features</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {features.map((f) => {
          const isActive = activeSection === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onSectionChange(f.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border-2 ${
                isActive 
                  ? "bg-primary/5 border-primary shadow-inner" 
                  : "bg-card border-border shadow-sm active:scale-95"
              }`}
            >
              <div
                className={`${f.bg} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden`}
              >
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-b-full" />
                <f.icon className="h-6 w-6 text-white relative z-10" />
              </div>
              <div className="text-center">
                <p className={`text-xs font-bold leading-tight ${isActive ? "text-primary" : "text-foreground"}`}>
                  {f.label}
                </p>
                <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{f.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}