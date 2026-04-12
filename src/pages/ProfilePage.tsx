import { ArrowLeft, Settings, ChevronRight, Package, Heart, HelpCircle, LogOut, GraduationCap, Coins, ShoppingCart, Loader2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { user, profile, membership, signOut, loading: authLoading } = useAuth();
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }: any) => setOrderCount(count || 0));
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
    { 
      icon: Coins, 
      label: "My BCoins", 
      isLocked: !membership,
      action: () => {
        if (!membership) {
          toast.error("BizMart Club Membership required to access BCoins wallet.");
          navigate("/club");
        } else {
          navigate("/bcoins");
        }
      } 
    },
    { icon: ShoppingCart, label: "Cart", badge: totalItems > 0 ? String(totalItems) : undefined, action: () => navigate("/cart") },
    { icon: Heart, label: "Wishlist" },
    { icon: HelpCircle, label: "Help Center" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="h-5 w-5 text-secondary-foreground" />
          </button>
          <span className="text-secondary-foreground font-bold text-sm">Student Dashboard</span>
          <button className="p-1"><Settings className="h-5 w-5 text-secondary-foreground" /></button>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-secondary-foreground/20 flex items-center justify-center text-2xl">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : "🎓"}
          </div>
          <div>
            <h2 className="text-secondary-foreground font-bold text-lg">
              {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : "Student"}
            </h2>
            <p className="text-secondary-foreground/70 text-xs">{profile?.email || user.email}</p>
          </div>
        </div>
      </div>

      <div className="mx-3 -mt-4 bg-card rounded-xl shadow-sm border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Student Information</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">School</p>
            <p className="text-xs font-bold text-foreground truncate">{profile?.school || "Not provided"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Grade Level</p>
            <p className="text-xs font-bold text-foreground">{profile?.grade_level || "Not provided"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Section</p>
            <p className="text-xs font-bold text-foreground">{profile?.section || "Not provided"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">BCoins</p>
            <p className="text-xs font-bold text-primary">{Number(profile?.bcoins || 0).toFixed(1)} 🪙</p>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-3 bg-card rounded-xl shadow-sm border border-border p-4 grid grid-cols-3 gap-4">
        {[
          { label: "In Cart", value: totalItems, action: () => navigate("/cart") },
          { label: "Orders", value: orderCount, action: () => navigate("/orders") },
          { 
            label: "BCoins", 
            value: Number(profile?.bcoins || 0).toFixed(1), 
            action: () => {
              if (!membership) {
                toast.error("Membership required to view BCoins wallet.");
                navigate("/club");
              } else {
                navigate("/bcoins");
              }
            }
          },
        ].map((stat) => (
          <button key={stat.label} onClick={stat.action} className="text-center">
            <p className="text-lg font-extrabold text-primary">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
          </button>
        ))}
      </div>

      <div className="mx-3 mt-3 bg-card rounded-xl border border-border overflow-hidden">
        {menuItems.map((item, i) => (
          <button 
            key={item.label} 
            onClick={item.action} 
            className={`w-full flex items-center gap-3 px-4 py-3.5 ${i < menuItems.length - 1 ? "border-b border-border" : ""} ${item.isLocked ? "opacity-60" : ""}`}
          >
            <item.icon className="h-5 w-5 text-primary" />
            <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>
            {item.isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
            {item.badge && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="mx-3 mt-3">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-card rounded-xl border border-border text-destructive font-semibold text-sm">
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      </div>
      <BottomNav />
    </div>
  );
}