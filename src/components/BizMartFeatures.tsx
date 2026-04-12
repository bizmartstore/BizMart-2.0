import { useNavigate } from "react-router-dom";
import { ShoppingBag, Store, Crown, Coins, Smartphone, Printer } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const features = [
  {
    id: "marketplace",
    label: "Marketplace",
    desc: "Shop Now",
    icon: ShoppingBag,
    bg: "bg-gradient-to-br from-orange-500 to-amber-400",
    emoji: "🛍️",
    path: "/marketplace",
  },
  {
    id: "sellers",
    label: "Sellers",
    desc: "Browse Stores",
    icon: Store,
    bg: "bg-gradient-to-br from-blue-600 to-indigo-500",
    emoji: "🏪",
    path: "/sellers",
  },
  {
    id: "club",
    label: "BizMart Club",
    desc: "VIP Access",
    icon: Crown,
    bg: "bg-gradient-to-br from-yellow-500 to-orange-500",
    emoji: "👑",
    path: "/club",
  },
  // BCoins feature removed as it's now part of BizMart Club
  {
    id: "gcash",
    label: "GCash",
    desc: "Cash In/Out",
    icon: Smartphone,
    bg: "bg-gradient-to-br from-sky-500 to-blue-600",
    emoji: "💳",
    path: "/gcash",
  },
  {
    id: "print",
    label: "Print Service",
    desc: "Upload & Print",
    icon: Printer,
    bg: "bg-gradient-to-br from-purple-500 to-pink-500",
    emoji: "🖨️",
    path: "/print-service",
  },
];

// Duplicate features for seamless infinite scroll
const duplicatedFeatures = [...features, ...features];

export default function BizMartFeatures() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number>(0);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const singleSetWidth = container.scrollWidth / 2;
    let lastTime = 0;
    const speed = 0.5; // pixels per frame (~30px/sec)

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
    // Resume after a short delay
    setTimeout(() => {
      if (scrollRef.current) {
        scrollPosRef.current = scrollRef.current.scrollLeft;
      }
      setIsPaused(false);
    }, 2000);
  };

  return (
    <div className="mt-5 px-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✨</span>
        <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">
          BizMart Features
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
            onClick={() => navigate(f.path)}
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
          </button>
        ))}
      </div>
    </div>
  );
}