/* App instalable: guarda la "cáscara" de la web para que abra rápido.
   La carta y los pedidos siempre se piden en vivo (Firebase). */
const V = "apamuy-v33";
const CASCARA = ["./", "pedido", "mis-pedidos", "negocio", "perfil", "enviar", "envio", "buscar", "rastreo", "privacidad", "eliminar-cuenta", "terminos", "cookies", "libro-reclamaciones", "legal.js", "styles.css", "app.js", "envios.js", "buscar.js", "nucleo.js", "pago.js", "demo.js", "semilla.js", "ubigeo.js", "firebase-config.js", "favicon.svg", "img/icon-192.png", "img/logo-apamuy.png", "manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CASCARA)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;          // Firebase, fuentes, etc.: directo a la red
  // Imágenes, mapa y lista de ciudades casi nunca cambian: se sirven al instante desde el celular y se renuevan por detrás
  if (/\/(img|lib)\/|ubigeo\.js$|\.(png|jpg|jpeg|svg|webp)$/.test(u.pathname)) {
    e.respondWith(caches.open(V).then(c => c.match(e.request).then(r => { const red = fetch(e.request).then(x => { if (x.ok) c.put(e.request, x.clone()); return x; }).catch(() => r); return r || red; })));
    return;
  }
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; })   // red primero: siempre lo último
    .catch(() => caches.match(e.request).then(r => r || caches.match("./"))));
});

// ===== Avisos (notificaciones) que manda apamuy-servidor =====
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) {}
  const m = d.data || d, fuerte = m.fuerte === "1";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    // Si la app está abierta y a la vista, el aviso se muestra adentro (la app ya suena)
    const vista = cs.filter(c => c.visibilityState === "visible");
    if (vista.length) { vista.forEach(c => c.postMessage({ tipo: "aviso", ...m })); return; }
    return self.registration.showNotification(m.titulo || "Apamuy", { body: m.cuerpo || "", icon: "img/icon-192.png", badge: "img/icon-192.png", tag: m.tag || "apamuy", renotify: true,
      requireInteraction: fuerte, vibrate: fuerte ? [600, 200, 600, 200, 600, 200, 600] : [200, 100, 200], data: { url: m.url || "./" } });
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close(); const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { const c = cs[0]; if (c) { c.focus(); return c.navigate ? c.navigate(url).catch(() => {}) : null; } return self.clients.openWindow(url); }));
});
