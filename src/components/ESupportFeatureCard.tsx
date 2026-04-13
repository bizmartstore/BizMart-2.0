import { Headset } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ESupportFeatureCard() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/e-support")}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-[0.93] transition-transform relative"
    >
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-b-full" />
        <Headset className="h-6 w-6 text-white relative z-10" />
      </div>
      <span className="text-[10px] font-bold text-foreground leading-tight text-center w-14">
        E-Support
      </span>
      <p className="text-[8px] text-muted-foreground text-center leading-tight">
        Report concerns safely
      </p>
    </button>
  );
}