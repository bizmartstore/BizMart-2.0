// ... existing code
      // Remove the problematic line that calls undefined function
      // notifyCustomerGCashComplete(tx.user_id, tx.type, tx.amount, status);
      // Instead, just reload the sales data
      loadSales();