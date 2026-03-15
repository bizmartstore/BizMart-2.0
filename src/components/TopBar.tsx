import { Search, ShoppingCart, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import NotificationBell from "@/components/NotificationBell";
import { useEffect, useState } from "react";

const LOGO_URL = "https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/bizmart-7an2vg/assets/wg7i8epdpxf3/BIZMART.png";

export default function TopBar() {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || 
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <div className="sticky top-0 z-40 bg-secondary px-3 py-2 flex items-center gap-2 shadow-md">
      <img src={LOGO_URL} alt="BizMart" className="h-8 rounded-lg object-contain cursor-pointer" onClick={() => navigate("/")} />
      <div
        onClick={() => navigate("/search")}
        className="flex-1 flex items-center gap-2 bg-secondary-foreground/10 rounded-full px-3 py-2 cursor-pointer"
      >
        <Search className="h-4 w-4 text-secondary-foreground/60" />
        <span className="text-xs text-secondary-foreground/60">Search in BizMart...</span>
      </div>
      <button onClick={() => setDark(!dark)} className="p-1.5">
        {dark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-secondary-foreground" />}
      </button>
      <button onClick={() => navigate("/cart")} className="p-1.5 relative">
        <ShoppingCart className="h-5 w-5 text-secondary-foreground" />
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
            {totalItems}
          </span>
        )}
      </button>
      <NotificationBell />
    </div>
  );
}
