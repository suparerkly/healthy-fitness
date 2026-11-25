// Service worker: ใช้งานออฟไลน์ได้ โหลดจากเน็ตก่อน ถ้าไม่มีเน็ตใช้ไฟล์ที่แคชไว้
// เปลี่ยนเลขเวอร์ชันทุกครั้งที่ปล่อยเวอร์ชันใหม่
const CACHE = 'healthyzoo-v2';
const ASSETS = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/data.js', 'js/firebase.js', 'icon.svg', 'manifest.webmanifest'];

// ไฟล์จากโดเมนอื่นที่แคชได้: ฟอนต์ และ Firebase SDK (ไม่ยุ่งกับการเชื่อมต่อ Firestore/Auth)
const CACHEABLE_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'www.gstatic.com'];

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
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === location.origin;
  if (!sameOrigin && !CACHEABLE_HOSTS.includes(url.hostname)) return; // ปล่อยให้เบราว์เซอร์จัดการเอง
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || (sameOrigin ? caches.match('index.html') : Response.error()))),
  );
});
