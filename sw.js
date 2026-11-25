// Service worker: ใช้งานออฟไลน์ได้ โหลดจากเน็ตก่อน ถ้าไม่มีเน็ตใช้ไฟล์ที่แคชไว้
// เปลี่ยนเลขเวอร์ชันทุกครั้งที่ปล่อยเวอร์ชันใหม่
const CACHE = 'healthyzoo-v1';
const ASSETS = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/data.js', 'icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && (new URL(e.request.url).origin === location.origin || e.request.url.includes('fonts.g'))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))),
  );
});
