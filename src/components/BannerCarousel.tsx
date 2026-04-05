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
    <div className="relative overflow-hidden rounded-xl mx-3 mt-2 bg-muted/30">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner, i) => (
          <div key={i} className="w-full flex-shrink-0">
            <div className="relative w-full" style={{ paddingBottom: "45%" }}>
              <img
                src={banner}
                alt={`Banner ${i + 1}`}
                className="absolute inset-0 w-full h-full object-contain rounded-xl"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {banners.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-4 bg-primary" : "w-1.5 bg-primary/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}