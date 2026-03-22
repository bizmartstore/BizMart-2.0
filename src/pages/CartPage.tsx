import { useState, useMemo } from "react";
import { notifyCustomerOrder, notifyCustomerBCoins } from "@/lib/notifications";
import { sendNotification } from "@/lib/notifications";
import { sendTelegramOrderNotify } from "@/lib/telegramNotify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/context/CartContext";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Truck, XCircle, Clock, CheckCheck2, MapPin, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart, updateQuantity, removeItem } = useCart();
  const [shippingMethod, setShippingMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryDetails, setDeliveryDetails] = useState({
    date: "",
    time: "",
    contact: "",
    address: "",
    gradeLevel: "",
    section: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateDeliveryFee = () => {
    if (shippingMethod === "delivery") {
      // Check if any item is from a seller (has seller_id)
      const hasSellerItem = items.some((item: any) => item.seller_id);
      return hasSellerItem ? 20 : 0; // ₱20 delivery fee if seller items exist
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const deliveryFee = calculateDeliveryFee();
    return subtotal + deliveryFee;
  };

  const calculateBcoinsEarned = () => {
    // Earn 10 BCoins per ₱100 spent (excluding delivery fee)
    const subtotal = calculateSubtotal();
    return Math.floor(subtotal / 100) * 10;
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (shippingMethod === "delivery") {
      if (!deliveryDetails.date || !deliveryDetails.time || !deliveryDetails.contact) {
        toast.error("Please fill in all delivery details");
        return;
      }
    }

    setIsProcessing(true);
    try {
      // Create order in database      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          shipping_method: shippingMethod,
          delivery_details: shippingMethod === "delivery" ? deliveryDetails : null,
          subtotal: calculateSubtotal(),
          delivery_fee: calculateDeliveryFee(),
          total: calculateTotal(),
          bcoins_earned: calculateBcoinsEarned(),
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderId = orderData.id;
      setOrderId(orderId);

      // Notify customer via OneSignal and Telegram
      await notifyCustomerOrder(user.id, "placed an order");
      await notifyCustomerBCoins(
        user.id,
        calculateBcoinsEarned(),
        "earned"
      );
      await sendTelegramOrderNotify("pending", {
        id: orderId,
        items: items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        customer_name: user.user_metadata?.full_name || "Customer",
        customer_grade_level: user.user_metadata?.grade_level,
        customer_section: user.user_metadata?.section,
        customer_contact: deliveryDetails.contact,
        delivery_type: shippingMethod,
        total: calculateTotal(),
      });

      // Clear cart
      clearCart();

      // Show success modal
      toast.success("Order placed successfully! 🎉");
      navigate(`/order-confirmation/${orderId}`);
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(`Failed to place order: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-sm ml-2">My Cart</span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Your cart is empty</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Continue Shopping
          </Button>
        </div>
      ) : (
        <>
          <div className="px-4 pt-4">
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-lg font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-muted-foreground">Items:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-muted-foreground">Subtotal:</span>
                  <span className="text-lg font-bold text-foreground">
                    ₱{calculateSubtotal().toFixed(2)}
                  </span>
                </div>
                {shippingMethod === "delivery" && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-muted-foreground">Delivery Fee:</span>
                      <span className="text-lg font-bold text-foreground">
                        ₱{calculateDeliveryFee().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-muted-foreground">BCoins Earned:</span>
                      <span className="text-lg font-bold text-primary">
                        +{calculateBcoinsEarned()} 🪙
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-lg font-bold text-foreground">Total:</span>
                  <span className="text-xl font-extrabold text-foreground">
                    ₱{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Method */}
          <div className="px-4 pt-4">
            <div className="bg-card rounded-xl p-4 border border-border">
              <h2 className="text-xl font-bold mb-4">Shipping Method</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="pickup"
                    name="shippingMethod"
                    checked={shippingMethod === "pickup"}
                    onChange={() => setShippingMethod("pickup")}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="pickup" className="ml-2 text-sm font-semibold">
                    Pickup at BizMart Store
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="delivery"
                    name="shippingMethod"
                    checked={shippingMethod === "delivery"}
                    onChange={() => setShippingMethod("delivery")}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="delivery" className="ml-2 text-sm font-semibold">
                    Delivery
                  </label>
                </div>
                {shippingMethod === "delivery" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold mb-2">Delivery Details</h3>
                    <div className="space-y-3">
                      <Label htmlFor="date" className="text-xs font-bold">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={deliveryDetails.date}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="time" className="text-xs font-bold">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={deliveryDetails.time}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="contact" className="text-xs font-bold">Contact Number</Label>
                      <Input                        id="contact"
                        type="tel"
                        value={deliveryDetails.contact}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, contact: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="address" className="text-xs font-bold">Address</Label>
                      <Input
                        id="address"
                        type="text"
                        value={deliveryDetails.address}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="gradeLevel" className="text-xs font-bold">Grade Level</Label>
                      <Input
                        id="gradeLevel"
                        type="text"
                        value={deliveryDetails.gradeLevel}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, gradeLevel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="section" className="text-xs font-bold">Section</Label>
                      <Input
                        id="section"
                        type="text"
                        value={deliveryDetails.section}
                        onChange={(e) => setDeliveryDetails({ ...deliveryDetails, section: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 pb-6">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full md:w-auto"
              >
                Continue Shopping
              </Button>
              <Button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full md:w-auto"
              >
                {isProcessing ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}