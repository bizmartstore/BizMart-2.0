import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Define the shape of a notification row
interface Notification {
  id?: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  icon: string;
  is_read?: boolean;
  created_at: string;
}

// Define admin notification shape
interface AdminNotification extends Notification {
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  icon: string;
}

export default function ProductDetail({ productId }: { productId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleOrder = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      // Fetch product details (assuming we have a product object)
      // For simplicity, we'll use a mock product; in reality, fetch from DB or context
      const product = { id: productId, name: "Sample Product", price: 100 }; // Replace with actual fetch

      // Create a notification for the user
      const userNotification: Notification = {
        user_id: user.id,
        title: "📦 Order Placed!",
        message: `Your order for ${product.name} has been received.`,
        type: "order_placed",
        link: "/orders",
        icon: "📦",
        is_read: false,
        created_at: new Date().toISOString(),
      };

      // Fetch admins (simplified; in reality, fetch from DB)
      const admins = [/* admin data */]; // Replace with actual admin fetch
      const adminNotifications: AdminNotification[] = admins.map((admin) => ({
        user_id: admin.user_id,
        title: "🛒 New Order Received",
        message: `New order for ${product.name} from ${user.email?.split("@")[0] || "User"}`,
        type: "new_order",
        link: "/admin?tab=orders",
        icon: "🛒",
        is_read: false,
        created_at: new Date().toISOString(),
      }));

      // Insert user notification
      await supabase.from<Notification>("notifications").insert([userNotification]);

      // Insert admin notifications
      await supabase.from<Notification>("notifications").insert(adminNotifications as Notification[]);

      // Proceed with order creation (simplified)
      // await supabase.from("orders").insert({ /* order data */ });

      toast({ title: "Order placed!", description: "Your order has been received." });
      navigate("/orders");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Product Details</h2>
      <p>Product ID: {productId}</p>
      <Button onClick={handleOrder} disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Place Order"}
      </Button>
    </div>
  );
}