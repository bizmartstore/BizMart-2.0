import { useState, useEffect } from "react";
import { useBanners } from "@/hooks/useProducts";
import banner1 from "@/assets/banner1.jpg";
import banner2 from "@/assets/banner2.jpg";

const fallbackBanners = [banner1, banner2];

export default function BannerCarousel() {
  const { data: dbBanners } = useBanners();
  const banners = dbBanners && dbBanners.length > 0 ? dbBanners : fallbackBanners;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="relative overflow-hidden rounded-xl mx-3 mt-2">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner, i) => (
          <img
            key={i}
            src={banner}
            alt={`Banner ${i + 1}`}
            className="w-full flex-shrink-0 aspect-[2/1] object-cover rounded-xl"
          />
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-4 bg-primary-foreground" : "w-1.5 bg-primary-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
