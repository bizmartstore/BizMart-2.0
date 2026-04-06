"use client";

import { useRef, useEffect, useState } from "react";

const features = [
  { id: "store", label: "BCoins Store", bg: "bg-gradient-to-br from-emerald-500 to-teal-500", emoji: "🎁" },
  { id: "games", label: "Ed-Games", bg: "bg-gradient-to-br from-purple-500 to-pink-500", emoji: "🎮" },
  { id: "daily", label: "Daily Login", bg: "bg-gradient-to-br from-orange-500 to-amber-400", emoji: "📅" },
  { id: "earn", label: "Cash In", bg: "bg-gradient-to-br from-sky-500 to-blue-600", emoji: "💰" },
  { id: "redeem", label: "Cash Out", bg: "bg-gradient-to-br from-rose-500 to-red-500", emoji: "💸" },
  { id: "history", label: "History", bg: "bg-gradient-to-br from-indigo-500 to-violet-500", emoji: "📊" },
  { id: "secure", label: "Secure", bg: "bg-gradient-to-br from-slate-600 to-slate-800", emoji: "🔒" },
];

const duplicatedFeatures = [...features, ...features];

export default function BCoinsFeatures() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number>(0);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const singleSetWidth = container.scrollWidth / 2;
    let lastTime = 0;
    const speed = 0.5;

    const animate = (time: number) => {
      if (!isPaused) {
        const delta = lastTime ? time - lastTime : 16;
        lastTime = time;
        scrollPosRef.current += speed * (delta / 16);
        if (scrollPosRef.current >= singleSetWidth) {
          scrollPosRef.current -= singleSetWidth;
        }
        container.scrollLeft = scrollPosRef.current;
      } else {
        lastTime = 0;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPaused]);

  const handleInteractionStart = () => setIsPaused(true);
  const handleInteractionEnd = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollPosRef.current = scrollRef.current.scrollLeft;
      }
      setIsPaused(false);
    }, 2000);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✨</span>
        <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">BCoins Features</span>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide"
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
      >
        {duplicatedFeatures.map((f, idx) => (
          <div
            key={`${f.id}-${idx}`}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className={`${f.bg} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-b-full" />
              <span className="text-2xl relative z-10">{f.emoji}</span>
            </div>
            <span className="text-[10px] font-bold text-foreground leading-tight text-center w-14">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}