const handleSubmit = async () => {
    if (!user) { navigate("/login"); return; }
    if (!storeOpen) { toast.error("Store is currently closed."); return; }
    if (!file) { toast.error("Please upload a PDF file"); return; }
    if (!pages.length) { toast.error("PDF analysis incomplete"); return; }
    
    // Validate pickupDate is today
    if (pickupDate !== today) {
      toast.error("Please select today's date for pickup/delivery.");
      return;
    }
    
    // Validate pickupTime is at least 10 minutes ahead of current time    const selectedTime = new Date(`1970-01-01T${pickupTime}:00`);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // 10 minutes ahead
    if (selectedTime < now) {
      toast.error("Pickup time must be at least 10 minutes from now.");
      return;
    }
    
    if (!pickupDate || !pickupTime) { toast.error("Please select date and time."); return; }
    if (selectedPages.length === 0) { toast.error("Please select at least one page to print"); return; }
    
    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      toast.error("Please select at least one page to print");
      return;
    }

    // Additional validation for selected pages
    const selectedPagesData = selectedPages.map(p => ({
      page_num: p.pageNum,
      is_color: p.isColor,
      selected: p.selected,
    }));
    
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `prints/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage        .from("print-orders")
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from("print-orders").getPublicUrl(fileName);
      
      const { data: orderData, error: insertError } = await supabase
        .from("print_orders")
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          file_name: file.name,
          total_pages: selectedPages.length * copies,
          bw_pages: selectedPages.filter(p => !p.isColor).length * copies,
          colored_pages: selectedPages.filter(p => p.isColor).length * copies,
          page_size: pageSize,
          delivery_type: deliveryType,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          cost: calculateCost(),
          status: "pending",
        } as any)
        .select()
        .single();
      
      if (insertError) throw insertError;
            // Notify admin about new print order
      const userName = profile?.first_name || "User";
      await sendNotification({
        title: "🖨️ New Print Order",
        message: `User ${userName} submitted a print order for ${selectedPages.length} pages.`,
        type: "print_order",
        userId: user.id,
        link: "/admin/print",
        icon: "🖨️",
      });
      
      toast.success("Print order submitted successfully!");
      setOrderComplete(true);
      load();
    } catch (error: any) {
      toast.error("Failed to submit print order: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };