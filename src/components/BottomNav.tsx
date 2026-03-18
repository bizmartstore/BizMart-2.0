import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const tabs = [  { path: "/", icon: "🏠", label: "Home" },
  { path: "/categories", icon: "🗂️", label: "Categories" },
  { path: "/messages", icon: "💬", label: "Messages" },
  { path: "/cart", icon: "🛒", label: "Cart" },
  { path: "/profile", icon: "👤", label: "Me" },
];
export default function BottomNav() {
  const location = useLocation();  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loadUnread = async () => {
      const { data: convos } = await (supabase as any)
        .from("conversations")
        .select("id")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);
      if (!convos || convos.length === 0) { setUnreadMessages(0); return; }
      const ids = convos.map((c: any) => c.id);      const { count } = await (supabase as any)
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", ids)
        .eq("is_read", false)
        .neq("sender_id", user.id);
      setUnreadMessages(count || 0);    };
    loadUnread();
    const channel = supabase.channel("unread-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => loadUnread())      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => loadUnread())
      .subscribe();    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const dynamicTabs = tabs.map((tab) => {
    if (tab.path === "/profile" && !user) {
      return { path: "/login", icon: "🔑", label: "Login" };
    }
    return tab;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 shadow-2xl">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {dynamicTabs.map((tab) => {
          const isActive = location.pathname === tab.path;          return (
            <button              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-all duration-200 ${                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${isActive ? "bg-primary/10" : ""}`}>
                <span className={`text-xl transition-transform duration-200 inline-block ${isActive ? "scale-110" : ""}`}>
                  {tab.icon}
                </span>
                {tab.path === "/cart" && totalItems > 0 && (                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1 shadow-sm">                    {totalItems}
                  </span>
                )}
                {tab.path === "/messages" && unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1 shadow-sm animate-pulse">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </div>
              <span className={`text-[10px] transition-all ${isActive ? "font-extrabold text-primary" : "font-semibold"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}