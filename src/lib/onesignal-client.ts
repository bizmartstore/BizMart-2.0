/**
 * OneSignal Client-Side SDK (Web Push)
 * Uses OneSignal Web SDK v2 for browser push notifications
 */

declare global {
  interface Window {
    OneSignal: any;
  }
}

let oneSignalInitialized = false;
let oneSignalDeferred: ((OS: any) => void)[] = [];

// Initialize OneSignal in the browser
export function initOneSignal() {
  if (typeof window === 'undefined' || oneSignalInitialized) return;

  // Load OneSignal SDK script
  const script = document.createElement('script');
  script.src = 'https://cdn.onesignal.com/sdks/web/v2/OneSignalSDK.page.js';
  script.async = true;
  script.onload = () => {
    if (!window.OneSignal) {
      console.error('[OneSignal] SDK failed to load');
      return;
    }

    window.OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID || '617c000e-3cf8-4077-b083-9b4fea4018de',
      allowLocalhostAsSecureOrigin: true,
      // Optional: customize notification appearance
      notifyButton: {
        enable: false, // We'll use our own custom prompt
      },
      // Subdomain for Safari push notifications (if needed)
      // subdomainName: 'notifs',
    });

    oneSignalInitialized = true;
    oneSignalDeferred.forEach(cb => cb(window.OneSignal));
    oneSignalDeferred = [];

    console.log('[OneSignal] Initialized successfully');
  };
  document.head.appendChild(script);
}

// Wait for OneSignal to be ready
export function onOneSignalReady(callback: (OS: any) => void) {
  if (oneSignalInitialized && window.OneSignal) {
    callback(window.OneSignal);
  } else {
    oneSignalDeferred.push(callback);
  }
}

// Login user with OneSignal (associate push notifications with user ID)
export async function oneSignalLogin(userId: string, email?: string, name?: string, role?: string) {
  return new Promise<void>((resolve, reject) => {
    onOneSignalReady(async (OS) => {
      try {
        if (typeof OS.login === 'function') {
          await OS.login(userId);
          console.log(`[OneSignal] User logged in: ${userId}`);
        }

        // Set user tags for targeting
        if (OS.User && typeof OS.User.addTags === 'function') {
          const tags: any = {
            user_id: userId,
            email: email || '',
            name: name || '',
            role: role || 'customer',
          };

          // Add admin flag
          if (role === 'main_admin' || role === 'member_admin') {
            tags.admin = 'true';
          }

          await OS.User.addTags(tags);
          console.log('[OneSignal] User tags set:', tags);
        }

        resolve();
      } catch (error) {
        console.error('[OneSignal] Login failed:', error);
        reject(error);
      }
    });
  });
}

// Logout user from OneSignal
export async function oneSignalLogout() {
  return new Promise<void>((resolve, reject) => {
    onOneSignalReady(async (OS) => {
      try {
        if (typeof OS.logout === 'function') {
          await OS.logout();
          console.log('[OneSignal] User logged out');
        }
        resolve();
      } catch (error) {
        console.error('[OneSignal] Logout failed:', error);
        reject(error);
      }
    });
  });
}

// Request push notification permission
export async function requestPushPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    onOneSignalReady(async (OS) => {
      try {
        if (!OS.Notifications) {
          console.warn('[OneSignal] Notifications not available');
          resolve(false);
          return;
        }

        const permission = await OS.Notifications.permission;
        const permissionString = typeof permission === 'boolean' 
          ? (permission ? 'granted' : 'denied') 
          : permission;

        if (permissionString === 'default') {
          await OS.Notifications.requestPermission();
          resolve(true);
        } else if (permissionString === 'granted') {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error('[OneSignal] Permission request failed:', error);
        resolve(false);
      }
    });
  });
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Get current notification permission status
export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';
  return await Notification.permission;
}