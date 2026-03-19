// ... existing code remains the same until the handleSendCode function

  const handleSendCode = async () => {
    if (!sendingCode || !selectedUserId) { toast.error("Select a user"); return; }

    const targetProfile = profiles.find(p => p.user_id === selectedUserId);
    const targetName = targetProfile ? `${targetProfile.first_name} ${targetProfile.last_name}` : "User";

    // Update the code with sent info
    const table = sendingCode.type === "club" ? "club_codes" : "seller_codes";
    await (supabase as any).from(table).update({
      sent_to_name: targetName,
      sent_at: new Date().toISOString(),
    }).eq("id", sendingCode.id);

    // Send notification to the user via notification bell
    if (sendingCode.type === "club") {
      notifyAdminNewRegistration(targetName, targetProfile?.email || "");
    }

    toast.success(`Code sent to ${targetName}! They'll see it in their notification bell 🔔`);
    setSendingCode(null);
    setSelectedUserId("");
    setSearchUser("");
    load();
  };

// ... rest of the component remains unchanged