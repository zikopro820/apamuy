/* App instalable: guarda la "cáscara" de la web para que abra rápido.
   La carta y los pedidos siempre se piden en vivo (Firebase). */
const V = "apamuy-v7";
const CASCARA = ["./", "pedido", "mis-pedidos", "negocio", "perfil", "enviar", "envio", "rastreo", "privacidad", "terminos", "cookies", "libro-reclamaciones", "legal.js", "styles.css", "app.js", "envios.js", "nucleo.js", "pago.js", "demo.js", "semilla.js", "ubigeo.js", "firebase-config.js", "favicon.svg", "img/icon-192.png", "manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CASCARA)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;          // Firebase, fuentes, etc.: directo a la red
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; })   // red primero: siempre lo último
    .catch(() => caches.match(e.request).then(r => r || caches.match("./"))));
});
