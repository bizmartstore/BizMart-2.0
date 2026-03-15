export async function promptForPush() {
  const OneSignal = await getOneSignal(5000);
  if (!OneSignal?.Notifications) {
    console.warn("[OneSignal] Notifications not available");
    return;
  }
  try {
    const permission = await OneSignal.Notifications.permission;
    console.log("[OneSignal] Current permission:", permission);
    // Request permission only if it's still in "default" state (user hasn't decided yet)
    if (permission === "default") {
      await OneSignal.Notifications.requestPermission();
      console.log("[OneSignal] Requested permission");
    } else {
      console.log("[OneSignal] Permission already set to:", permission);
    }
  } catch (error) {
    console.error("[OneSignal] Error requesting permission:", error);
  }
}