export async function promptForPush() {
  console.log("[NotificationPromptBanner] Allow button clicked, requesting push permission...");
  const OneSignal = await getOneSignal(10000);
  if (!OneSignal?.Notifications) {
    console.warn("[NotificationPromptBanner] OneSignal Notifications not available");
    return;
  }
  try {
    let permission = await OneSignal.Notifications.permission;
    console.log("[NotificationPromptBanner] OneSignal permission status:", permission);
    
    // Handle both string and boolean responses
    const permissionString = typeof permission === 'boolean' ? (permission ? 'granted' : 'denied') : permission;
    
    if (permissionString === "default") {
      console.log("[NotificationPromptBanner] Requesting OneSignal permission...");
      const result = await OneSignal.Notifications.requestPermission();
      console.log("[NotificationPromptBanner] Permission request result:", result);
    } else {
      console.log("[NotificationPromptBanner] Permission already:", permissionString);
    }
  } catch (error) {
    console.error("[NotificationPromptBanner] Error requesting permission:", error);
  }
}