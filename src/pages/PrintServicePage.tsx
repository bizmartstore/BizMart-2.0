// ... existing code until handleSubmit function

  const handleSubmit = async () => {
    if (!user || !file || selectedPages.length === 0) return;
    if (!pickupTime) {
      toast.error("Please select pickup/delivery time");
      return;
    }
    
    // NEW: Ensure date is today (the date is fixed to today but add validation anyway)
    if (pickupDate !== today) {
      toast.error("Please select today's date for pickup/delivery");
      return;
    }
    
    // Validate: time must be at least 10 minutes from now
    const selectedDT = new Date(`${today}T${pickupTime}`);
    const now = new Date();
    const minDT = new Date(now.getTime() + 10 * 60000);
    
    if (selectedDT < minDT) {
      toast.error("Pickup time must be at least 10 minutes from now");
      return;
    }

    setSubmitting(true);
    // ... rest of the function remains the same
  };

// ... rest of the file remains unchanged