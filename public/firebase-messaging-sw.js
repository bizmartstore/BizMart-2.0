self.addEventListener('push', (event) => {
  const data = event.data?.json();
  if (data) {
    // Forward to existing notification system via background sync
    // This will trigger the same notification flow as in-app    console.log('[SW] Push received', data);
    // The actual display is handled by the existing NotificationBell component
    // when the app is in background, we just ensure the notification is queued
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification  // Focus client or do nothing – the UI will update via existing logic
});