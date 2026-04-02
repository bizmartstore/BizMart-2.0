// In handleCheckout, remove the BCoins wallet update code.
// Keep only the order insertion with bcoins_earned field.
// The BCoins will be awarded when the order is completed via OrdersPage listener.

// Remove these lines from handleCheckout:
//   // Step 4: Add BCoins to user's wallet (THIS WAS MISSING!)
//   await withRetry(async () => {
//     // First, ensure wallet exists
//     const { data: wallet } = await (supabase as any)
//       .from("bcoins_wallets")
//       .select("balance")
//       .eq("user_id", user.id)
//       .maybeSingle();
//     
//     if (wallet) {
//       // Update existing wallet
//       const newBalance = Number(wallet.balance) + bcoinsEarned;
//       const { error } = await (supabase as any)
//         .from("bcoins_wallets")
//         .update({ balance: newBalance, updated_at: new Date().toISOString() })
//         .eq("user_id", user.id);
//       if (error) throw error;
//     } else {
//       // Create new wallet with initial balance
//       const { error } = await (supabase as any)
//         .from("bcoins_wallets")
//         .insert({ user_id: user.id, balance: bcoinsEarned });
//       if (error) throw error;
//     }
//     
//     // Record the transaction
//     await (supabase as any).from("bcoins_transactions").insert({
//       user_id: user.id,
//       amount: bcoinsEarned,
//       type: "earn_order",
//       description: `Purchase: ${items.length} item(s) - ₱${totalPrice.toFixed(2)}`,
//     });
//   });