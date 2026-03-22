import { ArrowLeft, Settings, ChevronRight, Package, Heart, Star, MapPin, HelpCircle, LogOut, GraduationCap, Coins, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { user, profile } = useAuth();               // ✅ Get profile
  const [orderCount, setOrderCount] = useState(0);
  const [bcoins, setBcoins] = useState(0);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }: any) => setOrderCount(count || 0));
    (supabase as any).from('bcoins_wallets').select('balance').eq('user_id', user.id).maybeSingle()
      .then(({ data }: any) => setBcoins(data?.balance || 0));
  }, [user]);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const menuItems = [
    { icon: Package, label: "My Orders", badge: orderCount > 0 ? String(orderCount) : undefined, action: () => navigate("/orders") },
    { icon: Coins, label: "My BCoins", badge: bcoins > 0 ? String(bcoins) : undefined, action: () => navigate("/bcoins") },
    { icon: ShoppingCart, label: "Cart", badge: totalItems > 0 ? String(totalItems) : undefined, action: () => navigate("/cart") },
    { icon: Heart, label: "Wishlist" },
    { icon: HelpCircle, label: "Help Center" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-secondary px-4 pt-6 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="h-5 w-5 text-secondary-foreground" />
          </button>
          <span className="text-secondary-foreground font-bold text-sm">Student Dashboard</span>
          <button className="p-1">
            <Settings className="h-5 w-5 text-secondary-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-secondary-foreground/20 flex items-center justify-center text-2xl">
            🎓
          </div>
          <div>
            <h2 className="text-secondary-foreground font-bold text-lg">
              {profile ? `${profile.first_name} ${profile.last_name}` : "Student"}
            </h2>
            <p className="text-secondary-foreground/70 text-xs">
              {profile?.email || user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Student Info Card */}
      {profile && (                                   // ✅ Use profile
        <div className="mx-3 -mt-4 bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Student Information</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">School</p>
              <p className="text-xs font-bold text-foreground">{profile.school}</p>               {/* ✅ Use profile */}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">Grade Level</p>
              <p className="text-xs font-bold text-foreground">{profile.grade_level}</p>               {/* ✅ Use profile */}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">Section</p>
              <p className="text-xs font-bold text-foreground">{profile.section}</p>               {/* ✅ Use profile */}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium">BCoins</p>
              <p className="text-xs font-bold text-primary">{Number(bcoins).toFixed(1)} 🪙</p>
            </div>
          </div>
        </div>
      )} 

      {/* Quick Stats */}
      <div className="mx-3 mt-3 bg-card rounded-xl border border-border p-4 grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <button key={i} className="text-center">
            <p className="text-lg font-extrabold text-primary">{i === 0 ? totalItems : i === 1 ? orderCount : Number(bcoins).toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{i === 0 ? "In Cart" : i === 1 ? "Orders" : "BCoins"}</p>
          </button>
        ))}  
      </div> 

      {/* Menu */}
      <div className="mx-3 mt-3 bg-card rounded-xl border border-border overflow-hidden">
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors ${i < menuItems.length - 1 ? "border-b border-border" : ""}`}
          >
            <item.icon className="h-5 w-5 text-primary" />
            <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>
            {item.badge && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )} 
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="mx-3 mt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-card rounded-xl text-destructive font-semibold text-sm"
        >
          <LogOut className="h-4 w-4" />
          Log Out        </button>
      </div>

      <BottomNav />
    </div>
  );
}