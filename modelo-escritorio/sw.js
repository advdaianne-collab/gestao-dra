/* Busca sempre a versão nova na internet; usa a cópia guardada só se estiver sem conexão.
   Nunca guarda nada do Supabase (dados e login). */
const CACHE = 'dra-' + self.registration.scope;
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || /supabase\.co/.test(r.url)) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok && (res.type === 'basic' || res.type === 'cors')) { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); }
      return res;
    }).catch(() => caches.match(r))
  );
});
