// ... existing code until handleCheckout function

  const handleCheckout = async () => {
    if (!user) { navigate("/login"); return; }
    if (!storeOpen) { toast.error("Store is currently closed."); return; }
    if (!pickupDate || !pickupTime) { toast.error("Please select date and time."); return; }
    
    // NEW: Ensure date is today
    if (pickupDate !== today) {
      toast.error("Please select today's date for pickup/delivery");
      setCheckingOut(false);
      return;
    }
    
    if (items.length === 0) { toast.error("Cart is empty"); return; }

    const selectedDT = new Date(`${pickupDate}T${pickupTime}`);
    const minDT = new Date();
    minDT.setMinutes(minDT.getMinutes() + 10);
    if (selectedDT < minDT) {
      toast.error("Please select a time at least 10 minutes from now.");
      setCheckingOut(false);
      return;
    }

    setCheckingOut(true);
    // ... rest of the function remains the same
  };

// ... rest of the file remains unchanged