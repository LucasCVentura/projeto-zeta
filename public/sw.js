self.addEventListener("push", function (event) {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Kira Admin", {
      body: data.body ?? "",
      icon: "/brand/kira-bonsai-192.png",
      badge: "/brand/kira-bonsai-192.png",
      data: { url: data.url ?? "/admin" },
    })
  )
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()
  const url = event.notification.data?.url ?? "/admin"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/admin") && "focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
