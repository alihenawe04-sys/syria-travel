self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('push', (e) => {
  try {
    const data = e.data ? e.data.json() : {};
    const title = data.title || 'Syrian Golden Gate Admin';
    const opts = {
      body: data.message || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'syria-admin-notif',
      data: { url: data.url || '/manage-panel' }
    };
    e.waitUntil(self.registration.showNotification(title, opts));
  } catch {
    e.waitUntil(self.registration.showNotification('Syrian Golden Gate Admin', { body: e.data ? e.data.text() : '' }));
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/manage-panel';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cl) => {
    for (const c of cl) { if (c.url.includes(url) && 'focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});

// Show notification from page (for background tabs)
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'show-notification') {
    self.registration.showNotification(e.data.title || 'Syrian Golden Gate Admin', {
      body: e.data.message || '',
      icon: '/favicon.ico',
      tag: e.data.tag || 'admin-notif'
    });
  }
});
