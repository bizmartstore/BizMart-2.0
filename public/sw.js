/**
 * Unified Service Worker
 * This file handles both PWA logic and OneSignal push notifications.
 * Importing the OneSignal SDK worker here prevents 'message' event warnings.
 */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Custom PWA logic can be added here if needed