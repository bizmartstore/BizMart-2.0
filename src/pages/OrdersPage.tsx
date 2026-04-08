@@ -45,12 +45,24 @@           await (supabase as any).from("orders").update({ status: newStatus }).eq("id", orderId);
          await sendNotification({
            title: "📦 Order Placed!",
            message: `Your order #${orderId.slice(0, 8)} has been received.`,
            type: "order_placed",
            userId: order.user_id,
            link: "/orders",
          });
+        // 👇 PRIMARY: Insert notification record directly (required architecture change)
+        const { data: notifData, error: notifErr } = await supabase
+          .from("notifications")
+          .insert({
+            user_id: order.user_id,
+            title: "📦 Order Placed!",
+            message: `Your order #${orderId.slice(0, 8)} has been received.`,
+            type: "order_placed",
+            link: "/orders"
+          });
+        if (notifErr) throw notifErr;
+
+        // Fetch admin users to notify them
+        const { data: adminRows } = await supabase
+          .from("user_roles")
+          .select("user_id")
+          .eq("role", "admin");
+
+        if (adminRows?.length) {
+          const adminNotifications = adminRows.map((a: any) => ({
+            user_id: a.user_id,
+            title: "🛒 New Order Received",
+            message: `New order #${orderId.slice(0, 8)} from ${order.user_email?.split('@')[0] || 'Customer'}`,
+            type: "new_order",
+            link: "/admin?tab=orders"
+          }));
+          await supabase.from("notifications").insert(adminNotifications);
+        }
      finally {
        setRefreshing(false);
      }
    }
  </script>