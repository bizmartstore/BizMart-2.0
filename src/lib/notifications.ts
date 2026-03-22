export async function notifyAdminNewRegistration(name: string, email: string) {
  await triggerNotification({
    title: "New Registration",
    message: `${name} <${email}>`,
    type: "registration",
    userId: null,
    targetRole: "main_admin",
  });
}

export async function notifyCustomerOrder(userId: string, action: string) {
  await triggerNotification({
    title: "Order Placed",
    message: `User ${action}`,
    type: "order",
    userId,
    targetRole: "admin",
  });
}

export async function notifyCustomerBCoins(userId: string, bcoins: number, action: string) {
  await triggerNotification({
    title: "BCoins Earned",
    message: `${action} ${bcoins} BCoins`,
    type: "bcoins",
    userId,
    targetRole: "admin",
  });
}

export async function notifyAdminRedemption(name: string, gcash: number) {
  await triggerNotification({
    title: "Redemption Requested",
    message: `${name} requested redemption of ₱${gcash}`,
    type: "redemption",
    userId: null,
    targetRole: "main_admin",
  });
}

export async function notifyAdminGCash(type: string, amount: number) {
  await triggerNotification({
    title: "GCash Transaction",
    message: `Admin GCash ${type} of ₱${amount}`,
    type: "gcash",
    userId: null,
    targetRole: "main_admin",
  });
}

export async function notifyAdminNewMember(name: string) {
  await triggerNotification({
    title: "New Member",
    message: `${name} joined BizMart Club`,
    type: "member",
    userId: null,
    targetRole: "main_admin",
  });
}

export async function notifyNewMessage(userId: string, senderName: string, message: string) {
  await triggerNotification({
    title: "New Message",
    message: `${senderName} sent a message`,
    type: "message",
    userId,
    targetRole: "admin",
    link: null,
    icon: "💬",
  });
}