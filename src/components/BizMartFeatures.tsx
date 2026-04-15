import { useNavigate } from "react-router-dom";
import { ShoppingBag, Store, Crown, Smartphone, Printer, Lock, Headset, Users } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const features = [
  {
    id: "marketplace",
    label: "Marketplace",
    desc: "Shop Now",
    icon: ShoppingBag,
    bg: "bg-gradient-to-br from-orange-500 to-amber-400",
    emoji: "🛍️",
    path: "/marketplace",
    restricted: false,
  },
  {
    id: "sellers",
    label: "Sellers",
    desc: "Browse Stores",
    icon: Store,
    bg: "bg-gradient-to-br from-blue-600 to-indigo-500",
    emoji: "🏪",
    path: "/sellers",
    restricted: false,
  },
  {
    id: "club",
    label: "BizMart Club",
    desc: "VIP Access",
    icon: Crown,
    bg: "bg-gradient-to-br from-yellow-500 to-orange-500",
    emoji: "👑",
    path: "/club",
    restricted: false,
  },
  {
    id: "organizations",
    label: "Organizations",
    desc: "Join Clubs",
    icon: Users,
    bg: "bg-gradient-to-br from-green-500 to-emerald-500",
    emoji: "🏫",
    path: "/organizations",
    restricted: false,
  },
  {
    id: "gcash",
    label: "GCash",
    desc: "Cash In/Out",
    icon: Smartphone,
    bg: "bg-gradient-to-br from-sky-500 to-blue-600",
    emoji: "💳",
    path: "/gcash",
    restricted: true,
  },
  {
    id: "print",
    label: "Print Service",
    desc: "Upload & Print",
    icon: Printer,
    bg: "bg-gradient-to-br from-purple-500 to-pink-500",
    emoji: "🖨️",
    path: "/print-service",
    restricted: true,
  },
  {
    id: "e-support",
    label: "E-Support",
    desc: "Report Concerns",
    icon: Headset,
    bg: "bg-gradient-to-br from-blue-500 to-blue-600",
    emoji: "🎧",
    path: "/e-support",
    restricted: false,
  },
];

const duplicatedFeatures = [...features, ...features];

export default function BizMartFeatures() {
  const navigate = useNavigate();
  const { user, membership } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number>(0);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const singleSetWidth = container.scrollWidth / 2;
    let lastTime = 0;
    const speed = 0.03;

    const getMaxScroll = () =>
      container.scrollWidth - container.clientWidth;

    if (scrollPosRef.current === 0) {
      const max = getMaxScroll();
scrollPosRef.current = max;
container.scrollLeft = max;
    }

    const animate = (time: number) => {
      if (!isPaused && document.visibilityState === "visible") {
        const delta = lastTime ? time - lastTime : 16;
        lastTime = time;

        scrollPosRef.current -= speed * delta;

        const max = getMaxScroll();

        if (scrollPosRef.current <= 0) {
          scrollPosRef.current = max;
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
      if (scrollRef.current) scrollPosRef.current = scrollRef.current.scrollLeft;
      setIsPaused(false);
    }, 2000);
  };

  const handleFeatureClick = (f: typeof features[0]) => {
    if (f.restricted && !membership) {
      if (!user) {
        navigate("/login");
      } else {
        toast.error(`BizMart Club Membership required for ${f.label}.`);
        navigate("/club");
      }
      return;
    }
    navigate(f.path);
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
        {duplicatedFeatures.map((f, idx) => {
          const isLocked = f.restricted && !membership;
          return (
            <button
              key={`${f.id}-${idx}`}
              onClick={() => handleFeatureClick(f)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-[0.93] transition-transform relative"
            >
              <div className={`${f.bg} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden ${isLocked ? 'grayscale-[0.5]' : ''}`}>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-b-full" />
                <span className="text-2xl relative z-10">{f.emoji}</span>
                {isLocked && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
                    <Lock className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-foreground leading-tight text-center w-14">
                {f.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}