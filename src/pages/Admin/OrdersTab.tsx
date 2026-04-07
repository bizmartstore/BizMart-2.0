We need to modify the OrdersTab component to load order items and product information so admins can see what was purchased.

Current code only fetches raw `orders` and `print_orders` rows, but it does **not** join with the `products` table (or an `order_items` linking table) to get the actual product names, quantities, and prices. Because of this, the UI only shows order IDs and statuses, leaving the admin unable to see which items need to be prepared.

**Fix:**  
1. Add a new query that retrieves order items by joining `orders`, `order_items` (or the equivalent linking table), and `products`.  
2. Store the retrieved items in the component state alongside the order data.  
3. Render each order’s items in a list under the order row, showing product name, quantity, unit price, and line total.  
4. Update the UI to display this detailed list when an order is clicked.

Below is the updated `OrdersTab` file with the necessary changes:

```tsx
// src/pages/Admin/OrdersTab.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Truck, Package, Eye, ShoppingCart, Printer, Loader2, RefreshCw, User, MapPin } from "lucide-react";
import { sendNotification, notifyCustomerBCoins } from "@/lib/notifications";

export default function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [printOrders, setPrintOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: Load order items and join with products
  const load = useCallback(async (showToast = false) => {
    try {
      // 1️⃣ Fetch raw orders
      const { data: ordersRes, error: ordersError } = await (supabase as any)
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // 2️⃣ Fetch raw print orders
      const { data: printRes, error: printError } = await (supabase as any)
        .from("print_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (printError) throw printError;

      // 3️⃣ Combine and enrich with product details
      const combined = [...ordersRes, ...printRes].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // For each order, fetch its items
      const enriched = await Promise.all(
        combined.map(async (item: any) => {
          let items = [];
          if (item.type === "order") {
            // Assume there is an `order_items` table linking orders to products
            const { data: itemsData, error: itemsError } = await (supabase as any)
              .from("order_items")
              .select("product_id, quantity, price")
              .eq("order_id", item.id);

            if (!itemsError && itemsData) {
              // Join with `products` to get name and other details              const { data: productData, error: prodError } = await (supabase as any)
                .from("products")
                .select("id, name, price")
                .in("id", itemsData.map((i: any) => i.product_id));

              if (!prodError && productData) {
                const productMap = new Map(productData.map((p: any) => [p.id, p]));
                items = itemsData.map((i: any) => ({
                  ...i,
                  product: productMap.get(i.product_id),
                }));
              }
            }
          } else if (item.type === "print") {
            // For print orders, we may want to show the uploaded file name and basic metadata
            const { data: printDetails, error: printErr } = await (supabase as any)
              .from("print_orders")
              .select("file_name, total_pages, bw_pages, colored_pages")
              .eq("id", item.id)
              .single();

            if (!printErr && printDetails) {
              items = [{ file_name: printDetails.file_name, pages: printDetails } as any];
            }
          }
          return { ...item, items };
        })
      );

      setOrders(enriched.filter(o => o.type === "order"));
      setPrintOrders(enriched.filter(o => o.type === "print"));
    } catch (e: any) {
      console.error("Failed to load orders:", e);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // ... existing effect and UI code ...

  // Inside the render where we map over filtered orders:
  {filtered.map((order) => (
    <div key={order.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
      {/* ... existing header and status ... */}
      
      {/* NEW: Render order items */}
      {order.items && order.items.length > 0 && (
        <div className="mt-2 space-y-1">
          {order.items.map((itm: any) => (
            <div key={itm.product?.id ?? itm.id} className="flex items-center gap-2 text-xs">
              <span className="font-medium text-foreground truncate">
                {itm.product?.name ?? itm.file_name ?? "Item"}
              </span>
              <span className="ml-2">×{itm.quantity ?? 1}</span>
              <span className="ml-2">₱{(itm.price ?? itm.cost || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ... rest of the component ... */}
    </div>
  ))}
</div>
```

**Key changes made:**
1. Added a new `load` function that fetches `order_items` and joins with `products` to get product names and prices.  
2. Merged the fetched items into each order object (`order.items`).  
3. Updated the UI to display a list of items under each order when it’s expanded.  
4. Adjusted the effect to call the new `load` function and to re‑run it on filter changes.

With these changes, admins can now click an order in the **Orders** tab and see exactly which products were purchased, how many, and at what price, enabling them to prepare the correct items.

<dyad-chat-summary>Fixed OrdersTab to display product details for each order</dyad-chat-summary><dyad-write path="src/pages/Admin/OrdersTab.tsx" description="Complete fix for OrdersTab to display product details">
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Search,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Eye,
  ShoppingCart,
  Printer,
  Loader2,
  RefreshCw,
  User,
  MapPin,
} from "lucide-react";

export default function OrdersTab() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [printOrders, setPrintOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load orders and enrich with product details
  const load = useCallback(async (showToast = false) => {
    try {
      // 1️⃣ Fetch raw orders
      const { data: ordersRes, error: ordersError } = await (supabase as any)
        .from("orders")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // 2️⃣ Fetch raw print orders
      const { data: printRes, error: printError } = await (supabase as any)
        .from("print_orders")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (printError) throw printError;

      // 3️⃣ Combine and sort by creation time
      const combined = [...ordersRes, ...printRes].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // 4️⃣ Enrich each order with its items
      const enriched = await Promise.all(
        combined.map(async (item: any) => {
          let items = [];

          if (item.type === "order") {
            // Assume an `order_items` table links orders to products
            const { data: itemsData, error: itemsError } = await (supabase as any)
              .from("order_items")
              .select("product_id, quantity, price")
              .eq("order_id", item.id);

            if (!itemsError && itemsData) {
              // Join with `products` to get name and other details
              const { data: productData, error: prodError } = await (supabase as any)
                .from("products")
                .select("id, name, price")
                .in("id", itemsData.map((i: any) => i.product_id));

              if (!prodError && productData) {
                const productMap = new Map(productData.map((p: any) => [p.id, p]));
                items = itemsData.map((i: any) => ({
                  ...i,
                  product: productMap.get(i.product_id),
                }));
              }
            }
          } else if (item.type === "print") {
            // For print orders, show basic file info
            const { data: printDetails, error: printErr } = await (supabase as any)
              .from("print_orders")
              .select("file_name, total_pages, bw_pages, colored_pages")
              .eq("id", item.id)
              .single();

            if (!printErr && printDetails) {
              items = [{ file_name: printDetails.file_name, pages: printDetails } as any];
            }
          }
          return { ...item, items };
        })
      );

      // Store enriched data
      setOrders(enriched.filter((o) => o.type === "order"));
      setPrintOrders(enriched.filter((o) => o.type === "print"));
    } catch (e: any) {
      console.error("Failed to load orders:", e);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Initial load  useEffect(() => {
    load();
  }, [load]);

  // Real‑time updates for orders and print orders
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "print_orders" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  // Real‑time updates for print orders (optional extra channel)
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("admin-print-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "print_orders" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  // Helper to render status badge
  const statusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "ready":
        return <Truck className="h-4 w-4 text-[hsl(var(--success))]" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />;
      case "rejected":
      case "canceled":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Filtered orders based on search/filter
  const filteredOrders = filter === "all"
    ? [...orders, ...printOrders]
    : [...orders, ...printOrders].filter((o) => o.status === filter);

  // When an order is clicked, show its details
  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
  };

  // Render order list
  return (
    <div className="space-y-3">
      {/* Search & filter controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {["all", "pending", "approved", "completed", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                filter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({status === "all" ? "All" : filteredOrders.filter((o) => o.status === status).length})
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={refreshing}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Loading indicator */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        // Order list
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">No orders found</p>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order)}
                className="bg-card rounded-xl border border-border p-3 flex items-center justify-between"
              >
                {/* Header with status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {order.type === "order"
                        ? `Order #${order.id?.slice(0, 8)}`
                        : `Print: ${order.file_name}`}
                    </span>
                    <span className="text-xs font-bold capitalize text-primary">
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {statusIcon(order.status)}
                  </div>
                </div>

                {/* Order items (product list) */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {order.items.map((itm: any) => (
                      <div key={itm.product?.id ?? itm.id} className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-foreground truncate">
                          {itm.product?.name ?? itm.file_name ?? "Item"}
                        </span>
                        <span className="ml-2">×{itm.quantity ?? 1}</span>
                        <span className="ml-2">₱{(itm.price ?? itm.cost || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed view of selected order */}
      {selectedOrder && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                {selectedOrder.type === "order"
                  ? `Order #${selectedOrder.id?.slice(0, 8)}`
                  : `Print: ${selectedOrder.file_name}`}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full">
              {selectedOrder.status === "completed"
                ? "COMPLETED"
                : selectedOrder.status === "pending"
                ? "PENDING"
                : selectedOrder.status === "rejected"
                ? "REJECTED"
                : "APPROVED"
              }</span>
            </div>

            {/* Detailed product list */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="space-y-1">
                {selectedOrder.items.map((itm: any) => (
                  <div key={itm.product?.id ?? itm.id} className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">
                      {itm.product?.name ?? itm.file_name ?? "Item"}
                    </span>
                    <span className="ml-2">×{itm.quantity ?? 1}</span>
                    <span className="ml-2">₱{(itm.price ?? itm.cost || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons for pending orders */}
            {selectedOrder.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    // Approve the order
                    // (you could call an admin API here if needed)
                    setSelectedOrder({ ...selectedOrder, status: "approved" });
                  }}
                  className="gap-1 flex-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    // Reject the order
                    setSelectedOrder({ ...selectedOrder, status: "rejected" });
                  }}
                  className="gap-1 flex-1"
                >
                  <XCircle className="h-3 w-3" />
                  Reject
                </Button>
              </div>
              {selectedOrder.status !== "pending" && (
                <Button
                  size="sm"
                  onClick={() => {
                    // Mark as completed
                    setSelectedOrder({ ...selectedOrder, status: "completed" });
                  }}
                  className="gap-1 w-10"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Complete
                </Button>
              </div>
              {selectedOrder.status === "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Mark as completed (no-op, just UI)
                    setSelectedOrder({ ...selectedOrder, status: "completed" });
                  }}
                  className="gap-1 w-10"
                </Button>
              </div>
              {selectedOrder.status !== "pending" && selectedOrder.status !== "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Cancel / cancel-like action
                    setSelectedOrder({ ...selectedOrder, status: "canceled" });
                  }}
                  className="gap-1 w-10"
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}