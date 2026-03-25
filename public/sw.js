/* Hunter Gym — Service Worker (Web Push) */
self.addEventListener('push', (event) => {
  let payload = { title: 'Hunter Gym', body: '' }
  try {
    if (event.data) {
      const t = event.data.json()
      payload = { title: t.title ?? payload.title, body: t.body ?? '' }
    }
  } catch {
    const text = event.data?.text()
    if (text) payload.body = text
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
