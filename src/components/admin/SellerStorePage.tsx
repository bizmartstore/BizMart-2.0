import { useState, useEffect, useRef } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Store, ArrowLeft, Save, Image, MapPin, MessageSquare, Loader2, Package, TrendingUp, X } from "lucide-react";
import SellerProductsTab from "@/components/seller/SellerProductsTab";

export default function SellerStorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    (supabase as any).from("seller_profiles").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }: any) => {
        if (!data) {
          navigate("/club");
          return;
        }
        setLoading(false);
      });
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />
      <div className="px-4 mt-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/")} className="p-1"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-foreground">My Seller Store</h1>
              <p className="text-[10px] text-muted-foreground">Manage your store, products & orders</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="products" className="text-xs gap-1"><Package className="h-3 w-3" />Products</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1"><Store className="h-3 w-3" />Store</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs gap-1"><TrendingUp className="h-3 w-3" />Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="products"><SellerProductsTab user={user} /></TabsContent>
          <TabsContent value="settings"><StoreSettingsTab user={user} /></TabsContent>
          <TabsContent value="orders"><SellerOrdersTab user={user} /></TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}