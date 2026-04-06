import { useNavigate } from "react-router-dom";
import { Coins, Store, Gamepad2, Calendar, Gift, Trophy, Star, Zap } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const features = [
  {
    id: "store",
    label: "BCoins Store",
    desc: "Redeem GCash",
    icon: Store,
    bg: "bg-gradient-to-br from-emerald-500 to-teal-500",
    emoji: "🛒",
    action: () => {}, // Will be handled in parent
  },
  {
    id: "edgames",
    label: "Ed-Games",
    desc: "Play & Earn",
    icon: Gamepad2,
    bg: "bg-gradient-to-br from-purple-500 to-pink-500",
    emoji: "🎮",
    action: () => {}, // Will be handled in parent
  },
  {
    id: "daily-login",
    label: "Daily Login",
    desc: "Claim BCoins",
    icon: Calendar,
    bg: "bg-gradient-to-br from-yellow-500 to-orange-500",
    emoji: "📅",
    action: () => {}, // Will be handled in parent
  },
  {
    id: "rewards",
    label: "Rewards",
    desc: "View All",
    icon: Gift,
    bg: "bg-gradient-to-br from-red-500 to-rose-500",
    emoji: "🎁",
    action: () => {}, // Placeholder for future
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    desc: "Top Earners",
    icon: Trophy,
    bg: "bg-gradient-to-br from-blue-500 to-indigo-500",
    emoji: "🏆",
    action: () => {}, // Placeholder for future
  },
  {
    id: "bonus",
    label: "Bonus",
    desc: "Special Offers",
    icon: Star,
    bg: "bg-gradient-to-br from-pink-500 to-rose-500",
    emoji: "⭐",
    action: () => {}, // Placeholder for future
  },
];

// Duplicate for seamless infinite scroll
const duplicatedFeatures = [...features, ...features];

interface BCoinsFeaturesProps {
  onFeatureClick?: (featureId: string) => void;
}

export default function BCoinsFeatures({ onFeatureClick }: BCoinsFeaturesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number>(0);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const singleSetWidth = container.scrollWidth / 2;
    let lastTime = 0;
    const speed = 0.4; // pixels per frame (~24px/sec)

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

  const handleFeatureClick = (featureId: string) => {
    if (onFeatureClick) {
      onFeatureClick(featureId);
    }
  };

  return (
    <div className="mt-4 px-3">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-5 w-5 text-warning" />
        <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">
          BCoins Center
        </span>
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
          <button
            key={`${f.id}-${idx}`}
            onClick={() => handleFeatureClick(f.id)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-[0.93] transition-transform"
          >
            <div
              className={`${f.bg} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden`}
            >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-b-full" />
              <span className="text-2xl relative z-10">{f.emoji}</span>
            </div>
            <span className="text-[10px] font-bold text-foreground leading-tight text-center w-14">
              {f.label}
            </span>
            <span className="text-[8px] text-muted-foreground">{f.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}