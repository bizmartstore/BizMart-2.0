// Replace the handleCheckout function with the updated version that validates date and time constraints
  const handleCheckout = async () => {
    if (!user) { navigate("/login"); return; }
    if (!storeOpen) { toast.error("Store is currently closed."); return; }
    
    // Validate pickupDate is today
    if (pickupDate !== today) {
      toast.error("Please select today's date for pickup/delivery.");
      return;
    }
    
    // Validate pickupTime is at least 10 minutes ahead of current time
    const selectedTime = new Date(`1970-01-01T${pickupTime}:00`);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // 10 minutes ahead
    if (selectedTime < now) {
      toast.error("Pickup time must be at least 10 minutes from now.");
      return;
    }
    
    if (!pickupDate || !pickupTime) { toast.error("Please select date and time."); return; }
    if (items.length === 0) { toast.error("Cart is empty"); return; }

    setCheckingOut(true);
    try {
      const { data: orderData, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            category: item.category,
          })),
          total: totalPrice + deliveryFee,
          delivery_type: deliveryType,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          delivery_fee: deliveryFee,
          bcoins_earned: totalPrice * 0.10,
          status: "pending",
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      if (orderData) {
        setOrderId((orderData as any).id);
        setOrderComplete(true);
        clearCart();
        toast.success("Order placed successfully!");
      } else {
        throw new Error("No order data returned");
      }
    } catch (error: any) {
      toast.error("Failed to place order: " + error.message);
    } finally {
      setCheckingOut(false);
    }
  };