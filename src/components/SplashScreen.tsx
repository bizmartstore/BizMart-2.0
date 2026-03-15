import { useState, useEffect } from "react";

const LOGO_URL = "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/bizmart-7an2vg/assets/wg7i8epdpxf3/BIZMART.png";

export default function SplashScreen({ onFinished }: { onFinished: () => void }) {
  const [phase, setPhase] = useState<"enter" | "logo" | "fadeout">("enter");

  useEffect(() => {
    const t0 = setTimeout(() => setPhase("logo"), 100);
    const t1 = setTimeout(() => setPhase("fadeout"), 2200);
    const t2 = setTimeout(() => onFinished(), 2800);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === "fadeout" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Subtle radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[hsl(24,95%,53%)]/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Logo */}
        <div
          className={`w-28 h-28 rounded-[1.75rem] bg-white shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] border border-black/5 flex items-center justify-center overflow-hidden transition-all duration-700 ${
            phase === "enter" ? "scale-75 opacity-0" : phase === "logo" ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <img src={LOGO_URL} alt="BizMart" className="w-24 h-24 object-contain" />
        </div>

        {/* App name */}
        <div className={`text-center transition-all duration-500 delay-200 ${
          phase === "logo" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Biz<span className="text-[hsl(24,95%,53%)]">Mart</span>
          </h1>
          <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-0.5">
            Online School Store
          </p>
        </div>

        {/* Loading dots */}
        <div className={`flex gap-1.5 mt-2 transition-all duration-500 delay-300 ${
          phase === "logo" ? "opacity-100" : "opacity-0"
        }`}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[hsl(24,95%,53%)] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.6s" }}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={`absolute bottom-8 text-center transition-all duration-500 delay-500 ${
        phase === "logo" ? "opacity-100" : "opacity-0"
      }`}>
        <p className="text-[9px] text-gray-300 font-medium">
          Developed by <span className="font-bold text-gray-400">JOEY ALBERT AGNAS</span>
        </p>
      </div>
    </div>
  );
}
