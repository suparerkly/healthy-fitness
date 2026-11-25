// Firebase: ระบบบัญชี (username + password) และเก็บข้อมูลใน Cloud Firestore
//
// Firebase Auth รองรับแค่อีเมล เราจึงแปลง username เป็นอีเมลภายใน เช่น "ton" -> "ton@users.healthyzoo.app"
// ผู้ใช้ไม่เห็นอีเมลนี้ และ Firebase จะช่วยกันไม่ให้ username ซ้ำกันเอง
//
// โครงสร้างข้อมูล
//   users/{uid}             -> { username, profile, settings, customFoods, recent, createdAt, updatedAt }
//   users/{uid}/days/{date} -> { meals, workouts, updatedAt }   (date = YYYY-MM-DD)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache,
  doc, getDoc, setDoc, getDocs, collection, writeBatch, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

// ค่า config ของเว็บแอป Firebase เป็นข้อมูลสาธารณะ (ไม่ใช่รหัสลับ) ความปลอดภัยมาจาก Firestore rules
const firebaseConfig = {
  apiKey: 'AIzaSyBY4t77XKp2zUogf7YRKPL527H6UTvDgvU',
  authDomain: 'healthy-fitness-2c475.firebaseapp.com',
  projectId: 'healthy-fitness-2c475',
  storageBucket: 'healthy-fitness-2c475.firebasestorage.app',
  messagingSenderId: '763433919989',
  appId: '1:763433919989:web:d24c1194c571fb820d2cbc',
  measurementId: 'G-5FB679GHTV',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// แคชข้อมูลไว้ในเครื่อง (IndexedDB) ให้ใช้งานออฟไลน์ได้ แล้วซิงก์ขึ้น cloud เมื่อกลับมาออนไลน์
let fs;
try {
  fs = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch {
  fs = initializeFirestore(app, { localCache: memoryLocalCache() });
}

// Analytics ตามที่ตั้งไว้ในโปรเจกต์ (โหลดเฉพาะเมื่อเบราว์เซอร์รองรับ และไม่ใช่ตอนทดสอบในเครื่อง)
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  import('https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js')
    .then(async ({ getAnalytics, isSupported }) => { if (await isSupported()) getAnalytics(app); })
    .catch(() => {});
}

/* ---------- Username helpers ---------- */
const EMAIL_DOMAIN = 'users.healthyzoo.app';
export const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;
export const normalizeUsername = (u) => String(u || '').trim().toLowerCase();
const toEmail = (username) => `${normalizeUsername(username)}@${EMAIL_DOMAIN}`;
export const usernameFromEmail = (email) => String(email || '').split('@')[0];

/* ---------- Auth ---------- */
export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function login(username, password) {
  const cred = await signInWithEmailAndPassword(auth, toEmail(username), password);
  return cred.user;
}

export async function register(username, password) {
  const cred = await createUserWithEmailAndPassword(auth, toEmail(username), password);
  return cred.user;
}

export function logout() {
  return signOut(auth);
}

export function authErrorMessage(err) {
  const code = err?.code || '';
  const map = {
    'auth/invalid-credential': 'username หรือรหัสผ่านไม่ถูกต้อง',
    'auth/wrong-password': 'username หรือรหัสผ่านไม่ถูกต้อง',
    'auth/user-not-found': 'username หรือรหัสผ่านไม่ถูกต้อง',
    'auth/invalid-email': 'username ใช้ได้เฉพาะ a-z, 0-9, _ และ .',
    'auth/email-already-in-use': 'username นี้มีคนใช้แล้ว ลองชื่ออื่น',
    'auth/weak-password': 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร',
    'auth/too-many-requests': 'ลองผิดหลายครั้งเกินไป รอสักครู่แล้วลองใหม่',
    'auth/network-request-failed': 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ ลองใหม่อีกครั้ง',
    'auth/operation-not-allowed': 'ยังไม่ได้เปิดการล็อกอินแบบ Email/Password ใน Firebase Console',
    'auth/unauthorized-domain': 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication',
    'permission-denied': 'ไม่มีสิทธิ์เข้าถึงข้อมูล ตรวจสอบ Firestore rules',
    unavailable: 'เชื่อมต่อ Firebase ไม่ได้ ลองใหม่อีกครั้ง',
  };
  return map[code] || `เกิดข้อผิดพลาด (${code || err?.message || 'unknown'})`;
}

/* ---------- Firestore ---------- */
const userRef = (uid) => doc(fs, 'users', uid);
const dayRef = (uid, key) => doc(fs, 'users', uid, 'days', key);

// โหลดข้อมูลทั้งหมดของผู้ใช้: ข้อมูลหลัก + บันทึกรายวัน
export async function loadUserData(uid) {
  const [snap, daysSnap] = await Promise.all([getDoc(userRef(uid)), getDocs(collection(fs, 'users', uid, 'days'))]);
  const meta = snap.exists() ? snap.data() : {};
  const days = {};
  daysSnap.forEach((d) => {
    const { meals, workouts } = d.data();
    days[d.id] = { meals: { breakfast: [], lunch: [], dinner: [], snack: [], ...(meals || {}) }, workouts: workouts || [] };
  });
  return {
    profile: meta.profile || null,
    settings: meta.settings || undefined,
    customFoods: meta.customFoods || [],
    recent: meta.recent || [],
    days,
  };
}

export function saveMeta(uid, username, db, isNew = false) {
  const data = {
    username,
    profile: db.profile,
    settings: db.settings,
    customFoods: db.customFoods,
    recent: db.recent,
    updatedAt: serverTimestamp(),
  };
  if (isNew) data.createdAt = serverTimestamp();
  return setDoc(userRef(uid), data, { merge: true });
}

export function saveDay(uid, key, day) {
  return setDoc(dayRef(uid, key), { meals: day.meals, workouts: day.workouts, updatedAt: serverTimestamp() });
}

// บันทึกหลายวันพร้อมกัน (ใช้ตอนย้ายข้อมูลเก่าในเครื่องขึ้น cloud ตอนสมัคร)
export async function saveDays(uid, days) {
  const keys = Object.keys(days);
  for (let i = 0; i < keys.length; i += 400) {
    const batch = writeBatch(fs);
    for (const k of keys.slice(i, i + 400)) {
      batch.set(dayRef(uid, k), { meals: days[k].meals, workouts: days[k].workouts, updatedAt: serverTimestamp() });
    }
    await batch.commit();
  }
}

export async function deleteDays(uid, keys) {
  for (let i = 0; i < keys.length; i += 400) {
    const batch = writeBatch(fs);
    for (const k of keys.slice(i, i + 400)) batch.delete(dayRef(uid, k));
    await batch.commit();
  }
}
