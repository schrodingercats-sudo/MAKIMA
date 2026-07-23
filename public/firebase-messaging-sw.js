/* eslint-disable no-undef */
// Import Firebase compatibility scripts inside Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase App in Background Service Worker Context
firebase.initializeApp({
  apiKey: 'placeholder-api-key',
  authDomain: 'placeholder-app.firebaseapp.com',
  projectId: 'placeholder-project',
  storageBucket: 'placeholder-project.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abcdef123456'
});

const messaging = firebase.messaging();

/**
 * Handle background FCM push notifications
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'Makima Fan Art Gallery';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'You have a new update in Makima Gallery.',
    icon: payload.notification?.icon || payload.data?.icon || '/images/coming-soon.jpg',
    image: payload.notification?.image || payload.data?.image || payload.data?.thumbnail || undefined,
    badge: '/images/coming-soon.jpg',
    data: {
      url: payload.data?.url || payload.notification?.click_action || '/gallery',
      artworkId: payload.data?.artworkId || null,
      timestamp: Date.now()
    }
  };

  return self.registration.showNotification(title, options);
});

/**
 * Handle notification click event in browser
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/gallery';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new tab if none open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
