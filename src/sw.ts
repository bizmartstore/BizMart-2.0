self.addEventListener('message', (event) => {
  // Handle OneSignal push notifications
  console.log('[Service Worker] Received message:', event.data);
  
  // Forward to OneSignal processing
  if (event.data && event.data.type === 'notification') {
    // Forward to OneSignal's internal handling
    self.registration.showNotification(
      event.data.title || 'New Notification',
      {
        body: event.data.message || '',
        icon: event.data.icon || '/icon.png',
        badge: '/icon.png'
      }
    );
  }
});