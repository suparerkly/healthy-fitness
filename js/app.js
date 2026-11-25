import {
  BUDDIES, ACTIVITY_LEVELS, GOALS, MEALS, FOOD_CATEGORIES, FOODS,
  PROGRAMS, PROGRAM_TAGS, LEVEL_LABELS, QUICK_ACTIVITIES,
} from './data.js';

/* =========================================================
   Utilities
   ========================================================= */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const fmt = (n) => Math.round(n).toLocaleString('th-TH');
const r1 = (n) => Math.round(n * 10) / 10;
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const pad = (n) => String(n).padStart(2, '0');
const dkey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => dkey(new Date());
const keyToDate = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const shiftKey = (k, n) => { const d = keyToDate(k); d.setDate(d.getDate() + n); return dkey(d); };
function dateLabel(k) {
  if (k === todayKey()) return 'วันนี้';
  if (k === shiftKey(todayKey(), -1)) return 'เมื่อวาน';
  return keyToDate(k).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}
const mmss = (sec) => `${Math.floor(sec / 60)}:${pad(Math.max(0, Math.floor(sec % 60)))}`;

/* =========================================================
   Storage
   ========================================================= */
const STORE_KEY = 'healthyzoo.v1';
function loadDB() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}
const db = Object.assign(
  { profile: null, days: {}, customFoods: [], recent: [], settings: { countBurned: true, sound: true } },
  loadDB(),
);
db.settings = Object.assign({ countBurned: true, sound: true }, db.settings);
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch { toast('บันทึกไม่สำเร็จ พื้นที่เก็บข้อมูลเต็ม'); }
}

const emptyDay = () => ({ meals: { breakfast: [], lunch: [], dinner: [], snack: [] }, workouts: [] });
const getDay = (k) => db.days[k] || emptyDay();
function ensureDay(k) {
  if (!db.days[k]) db.days[k] = emptyDay();
  return db.days[k];
}

/* =========================================================
   UI state
   ========================================================= */
const ui = {
  tab: 'home',
  date: todayKey(),
  screen: null, // { type: 'onboard' | 'program' | 'session' | 'summary', ... }
  sheet: null, // { type: 'addFood' | 'foodQty' | 'custom' | 'quick' | 'exit' | 'reset', ... }
  foodCat: 'all',
  foodQuery: '',
  progTag: 'all',
  form: null,
  session: null,
};

/* =========================================================
   Calculations
   ========================================================= */
function targets(p = db.profile) {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const act = ACTIVITY_LEVELS.find((a) => a.id === p.activity) || ACTIVITY_LEVELS[2];
  const goal = GOALS.find((g) => g.id === p.goal) || GOALS[1];
  const tdee = bmr * act.factor;
  const floor = p.sex === 'm' ? 1500 : 1200;
  const raw = tdee + goal.kcalDelta;
  const kcal = Math.max(floor, raw);
  const protein = p.weight * goal.proteinPerKg;
  const fat = (kcal * 0.25) / 9;
  const carb = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  return { bmr, tdee, kcal, protein, fat, carb, act, goal, floor, floorApplied: raw < floor };
}

function totals(k) {
  const d = getDay(k);
  const t = { kcal: 0, p: 0, c: 0, f: 0, burned: 0, items: 0 };
  for (const m of MEALS) {
    for (const it of d.meals[m.id] || []) {
      t.kcal += it.kcal * it.qty; t.p += it.p * it.qty; t.c += it.c * it.qty; t.f += it.f * it.qty; t.items++;
    }
  }
  t.burned = (d.workouts || []).reduce((s, w) => s + w.kcal, 0);
  return t;
}

function mealTotal(k, mealId) {
  return (getDay(k).meals[mealId] || []).reduce((s, it) => s + it.kcal * it.qty, 0);
}

function streak() {
  const has = (k) => { const d = db.days[k]; if (!d) return false; return d.workouts.length > 0 || MEALS.some((m) => d.meals[m.id].length); };
  let k = todayKey();
  if (!has(k)) k = shiftKey(k, -1);
  let n = 0;
  while (has(k) && n < 3650) { n++; k = shiftKey(k, -1); }
  return n;
}

function programStats(prog) {
  const n = prog.exercises.length;
  const S = prog.sets;
  const workSec = prog.exercises.reduce((s, ex) => s + (ex.type === 'time' ? ex.amount : ex.amount * 3), 0);
  const totalSec = S * workSec + (S * n - 1) * prog.rest + S * n * 5;
  const min = Math.max(1, Math.round(totalSec / 60));
  const weight = db.profile?.weight || 65;
  const kcal = prog.met * weight * (totalSec / 3600);
  return { n, sets: S, min, kcal };
}

const buddyOf = (p = db.profile) => BUDDIES.find((b) => b.id === p?.buddy) || BUDDIES[0];
const allFoods = () => [...FOODS, ...db.customFoods];
const findFood = (id) => allFoods().find((f) => f.id === id);
const catEmoji = { dish: '🍛', protein: '🍗', carb: '🍌', drink: '🧋', mine: '⭐' };

/* =========================================================
   Toast, sound
   ========================================================= */
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

let audioCtx;
function beep(freq = 880, ms = 120) {
  if (!db.settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(0.18, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + ms / 1000);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + ms / 1000);
  } catch { /* ไม่มีเสียงก็ไม่เป็นไร */ }
}
const vibrate = (p) => { try { navigator.vibrate?.(p); } catch { /* ignore */ } };

/* =========================================================
   Shared fragments
   ========================================================= */
function dateNav() {
  const isToday = ui.date === todayKey();
  return `<div class="datenav">
    <button data-act="date-prev" aria-label="วันก่อนหน้า">‹</button>
    <span data-act="date-today">${esc(dateLabel(ui.date))}</span>
    <button data-act="date-next" aria-label="วันถัดไป" ${isToday ? 'style="opacity:.3"' : ''}>›</button>
  </div>`;
}

function macroCard(label, emoji, val, target, cls, color) {
  const pct = target > 0 ? clamp((val / target) * 100, 0, 100) : 0;
  return `<div class="macro ${cls}">
    <span class="lbl">${emoji} ${label}</span>
    <span class="num">${fmt(val)}<span class="tiny" style="font-weight:300"> / ${fmt(target)} g</span></span>
    <div class="bar" style="background:#ffffffaa"><i style="width:${pct}%;background:${color}"></i></div>
  </div>`;
}

function buddyMessage(t, tg) {
  const name = db.profile.name ? db.profile.name : 'เพื่อน';
  const hour = new Date().getHours();
  const isToday = ui.date === todayKey();
  if (!isToday) {
    if (!t.items) return 'วันนั้นไม่มีบันทึกอาหารเลย';
    return `วันนั้นกินไป ${fmt(t.kcal)} kcal โปรตีน ${fmt(t.p)} g`;
  }
  if (!t.items) {
    if (hour < 11) return `อรุณสวัสดิ์ ${esc(name)}! เริ่มวันด้วยมื้อเช้ากันนะ`;
    return 'วันนี้ยังไม่ได้บันทึกอาหารเลย มาจดมื้อแรกกัน';
  }
  const budget = tg.kcal + (db.settings.countBurned ? t.burned : 0);
  if (t.kcal > budget + 50) return `เกินเป้ามา ${fmt(t.kcal - budget)} kcal แล้ว ไปเดินเล่นกันหน่อยไหม`;
  if (t.p >= tg.protein) return 'โปรตีนครบแล้ว! กล้ามเนื้อขอบคุณมาก 💪';
  const need = tg.protein - t.p;
  if (need > 40) return `ยังขาดโปรตีนอีก ${fmt(need)} g ลองอกไก่หรือเวย์ดูนะ`;
  if (t.burned > 0) return `ออกกำลังไปแล้ว ${fmt(t.burned)} kcal เก่งมาก! ขาดโปรตีนอีกนิด ${fmt(need)} g`;
  return `อีกนิดเดียว! โปรตีนขาดอีก ${fmt(need)} g`;
}

/* =========================================================
   Views: Home
   ========================================================= */
function viewHome() {
  const p = db.profile;
  const tg = targets();
  const t = totals(ui.date);
  const bd = buddyOf();
  const burned = db.settings.countBurned ? t.burned : 0;
  const budget = tg.kcal + burned;
  const remain = budget - t.kcal;
  const pct = clamp(t.kcal / budget, 0, 1);
  const C = 2 * Math.PI * 58;
  const pawOn = Math.floor(clamp(t.p / tg.protein, 0, 1) * 10);
  const st = streak();
  const day = getDay(ui.date);

  return `
  <header class="topbar">
    <div>
      <div class="muted small">สวัสดี${p.name ? ' ' + esc(p.name) : ''} 👋</div>
      <h1>Healthy Zoo</h1>
    </div>
    ${dateNav()}
  </header>

  <section class="card buddy-card">
    <div class="buddy" aria-hidden="true">${bd.emoji}</div>
    <div class="bubble grow">${buddyMessage(t, tg)}</div>
  </section>

  <section class="card">
    <div class="row between" style="margin-bottom:8px">
      <h3 style="font-size:17px">แคลอรี่</h3>
      ${st > 0 ? `<span class="streak">🔥 ต่อเนื่อง ${st} วัน</span>` : ''}
    </div>
    <div class="ring-wrap">
      <div class="ring ${remain < 0 ? 'over' : ''}">
        <svg viewBox="0 0 140 140" aria-hidden="true">
          <circle class="track" cx="70" cy="70" r="58"/>
          <circle class="val" cx="70" cy="70" r="58" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/>
        </svg>
        <div class="inner">
          <span class="big">${fmt(Math.abs(remain))}</span>
          <span class="tiny muted">${remain < 0 ? 'kcal เกิน' : 'kcal เหลือ'}</span>
        </div>
      </div>
      <div class="kv">
        <div class="row"><span><i class="dot" style="background:var(--bark)"></i>เป้าหมาย</span><b>${fmt(tg.kcal)}</b></div>
        <div class="row"><span><i class="dot" style="background:var(--leaf)"></i>กินไป</span><b>${fmt(t.kcal)}</b></div>
        <div class="row"><span><i class="dot" style="background:var(--fox)"></i>เผาผลาญ</span><b>${db.settings.countBurned ? '+' : ''}${fmt(t.burned)}</b></div>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="row between">
      <h3 style="font-size:17px">โปรตีน</h3>
      <span><b style="font-size:18px">${fmt(t.p)}</b> <span class="muted small">/ ${fmt(tg.protein)} g</span></span>
    </div>
    <div class="paws" aria-label="โปรตีน ${pawOn * 10}%">
      ${Array.from({ length: 10 }, (_, i) => `<span class="${i < pawOn ? 'on' : ''}" style="animation-delay:${i * 40}ms">🐾</span>`).join('')}
    </div>
  </section>

  <section class="grid3">
    ${macroCard('โปรตีน', '🥩', t.p, tg.protein, 'c-berry', 'var(--berry)')}
    ${macroCard('คาร์บ', '🍚', t.c, tg.carb, 'c-sun', 'var(--sun)')}
    ${macroCard('ไขมัน', '🥑', t.f, tg.fat, 'c-sky', 'var(--sky)')}
  </section>

  <div class="section-title"><h3>มื้ออาหาร</h3><button class="muted small" data-act="tab" data-v="food">ดูทั้งหมด ›</button></div>
  <section class="card list">
    ${MEALS.map((m) => `
      <div class="item">
        <div class="emo">${m.emoji}</div>
        <div class="grow"><div class="name">${m.label}</div><div class="tiny muted">${(day.meals[m.id] || []).length} รายการ</div></div>
        <b>${fmt(mealTotal(ui.date, m.id))}</b><span class="tiny muted">kcal</span>
        <button class="plus-btn" data-act="add-food" data-meal="${m.id}" aria-label="เพิ่ม${m.label}">+</button>
      </div>`).join('')}
  </section>

  <div class="section-title"><h3>ออกกำลังกาย</h3><button class="muted small" data-act="tab" data-v="workout">เลือกโปรแกรม ›</button></div>
  <section class="card list">
    ${day.workouts.length ? day.workouts.map(workoutRow).join('') : `<div class="empty">🦥 ยังไม่ได้ขยับเลย<br><button class="btn small leaf" style="margin-top:8px" data-act="tab" data-v="workout">ไปออกกำลังกัน</button></div>`}
  </section>`;
}

function workoutRow(w) {
  return `<div class="item">
    <div class="emo">${w.emoji}</div>
    <div class="grow"><div class="name">${esc(w.name)}</div><div class="tiny muted">${fmt(w.min)} นาที</div></div>
    <b>${fmt(w.kcal)}</b><span class="tiny muted">kcal</span>
    <button class="del" data-act="del-workout" data-id="${w.uid}" aria-label="ลบ">✕</button>
  </div>`;
}

/* =========================================================
   Views: Food log
   ========================================================= */
function viewFood() {
  const tg = targets();
  const t = totals(ui.date);
  const day = getDay(ui.date);
  return `
  <header class="topbar"><h1>บันทึกอาหาร</h1>${dateNav()}</header>
  <section class="card">
    <div class="grid3 center">
      <div><div class="tiny muted">กินไป</div><b style="font-size:20px">${fmt(t.kcal)}</b><div class="tiny muted">/ ${fmt(tg.kcal)} kcal</div></div>
      <div><div class="tiny muted">โปรตีน</div><b style="font-size:20px">${fmt(t.p)}</b><div class="tiny muted">/ ${fmt(tg.protein)} g</div></div>
      <div><div class="tiny muted">คาร์บ · ไขมัน</div><b style="font-size:20px">${fmt(t.c)} · ${fmt(t.f)}</b><div class="tiny muted">g</div></div>
    </div>
  </section>
  ${MEALS.map((m) => {
    const items = day.meals[m.id] || [];
    return `<section class="card">
      <div class="meal-head">
        <span class="emo">${m.emoji}</span>
        <div class="grow"><h3>${m.label}</h3><div class="tiny muted">${fmt(mealTotal(ui.date, m.id))} kcal</div></div>
        <button class="plus-btn" data-act="add-food" data-meal="${m.id}" aria-label="เพิ่ม${m.label}">+</button>
      </div>
      ${items.length ? `<div class="list" style="margin-top:6px">${items.map((it) => `
        <div class="item">
          <div class="grow">
            <div class="name">${esc(it.name)}</div>
            <div class="tiny muted">${r1(it.qty)} × ${esc(it.unit)} · P ${r1(it.p * it.qty)} · C ${r1(it.c * it.qty)} · F ${r1(it.f * it.qty)}</div>
          </div>
          <b>${fmt(it.kcal * it.qty)}</b>
          <button class="del" data-act="del-food" data-meal="${m.id}" data-id="${it.uid}" aria-label="ลบ ${esc(it.name)}">✕</button>
        </div>`).join('')}</div>` : ''}
    </section>`;
  }).join('')}`;
}

/* =========================================================
   Views: Workout
   ========================================================= */
function viewWorkout() {
  const list = PROGRAMS.filter((p) => ui.progTag === 'all' || p.tag === ui.progTag);
  const t = totals(todayKey());
  return `
  <header class="topbar"><h1>ออกกำลังกาย</h1><span class="streak">🔥 วันนี้ ${fmt(t.burned)} kcal</span></header>
  <button class="card row" style="text-align:left;width:100%" data-act="quick-open">
    <span style="font-size:34px">🐧</span>
    <div class="grow"><b>บันทึกกิจกรรมอื่น</b><div class="tiny muted">เดิน วิ่ง ปั่นจักรยาน ว่ายน้ำ ฯลฯ</div></div>
    <span class="plus-btn">+</span>
  </button>
  <div class="chips">${PROGRAM_TAGS.map((tg) => `<button class="chip ${ui.progTag === tg.id ? 'on' : ''}" data-act="prog-tag" data-v="${tg.id}">${tg.label}</button>`).join('')}</div>
  ${list.map((p) => {
    const s = programStats(p);
    return `<button class="card prog" data-act="prog-open" data-id="${p.id}">
      <div class="pic c-${p.color}">${p.emoji}</div>
      <div class="grow col" style="gap:4px">
        <div class="row between"><h3>${p.name}</h3><span class="badge c-${p.color}">${LEVEL_LABELS[p.level]}</span></div>
        <div class="tiny muted">${p.en}</div>
        <div class="stats"><span>⏱ <b>${s.min}</b> นาที</span><span>🐾 <b>${s.n}</b> ท่า</span><span>🔁 <b>${s.sets}</b> ${p.mode === 'sets' ? 'เซต' : 'รอบ'}</span></div>
      </div>
    </button>`;
  }).join('')}`;
}

/* =========================================================
   Views: Me
   ========================================================= */
function viewMe() {
  const p = db.profile;
  const tg = targets();
  const bd = buddyOf();
  const days = Array.from({ length: 7 }, (_, i) => shiftKey(todayKey(), -i));
  return `
  <header class="topbar"><h1>ฉันกับ${bd.name}</h1><button class="btn small ghost" data-act="edit-profile">✏️ แก้ไข</button></header>
  <section class="card row">
    <div class="buddy" aria-hidden="true">${bd.emoji}</div>
    <div class="grow">
      <h3>${esc(p.name || 'นักสู้สายสุขภาพ')}</h3>
      <div class="small muted">${p.sex === 'm' ? 'ชาย' : 'หญิง'} · ${p.age} ปี · ${p.weight} กก. · ${p.height} ซม.</div>
      <div class="small muted">${tg.act.emoji} ${tg.act.label} · ${tg.goal.emoji} ${tg.goal.label}</div>
    </div>
  </section>

  <section class="card col">
    <h3 style="font-size:17px">เป้าหมายต่อวัน</h3>
    <div class="grid2">
      <div class="macro c-leaf"><span class="lbl">🔥 แคลอรี่</span><span class="num">${fmt(tg.kcal)} kcal</span></div>
      <div class="macro c-berry"><span class="lbl">🥩 โปรตีน</span><span class="num">${fmt(tg.protein)} g</span></div>
      <div class="macro c-sun"><span class="lbl">🍚 คาร์บ</span><span class="num">${fmt(tg.carb)} g</span></div>
      <div class="macro c-sky"><span class="lbl">🥑 ไขมัน</span><span class="num">${fmt(tg.fat)} g</span></div>
    </div>
    <details>
      <summary class="small" style="color:var(--fox)">ดูวิธีคำนวณ ›</summary>
      <div class="formula" style="margin-top:8px">
        <b>BMR</b> (Mifflin-St Jeor) = 10×${p.weight} + 6.25×${p.height} − 5×${p.age} ${p.sex === 'm' ? '+ 5' : '− 161'} = <b>${fmt(tg.bmr)}</b> kcal<br>
        <b>TDEE</b> = BMR × ${tg.act.factor} (${tg.act.label}) = <b>${fmt(tg.tdee)}</b> kcal<br>
        <b>เป้าแคล</b> = TDEE ${tg.goal.kcalDelta >= 0 ? '+' : '−'} ${Math.abs(tg.goal.kcalDelta)} = <b>${fmt(tg.kcal)}</b> kcal${tg.floorApplied ? ` <span class="muted">(ปรับขึ้นเป็นขั้นต่ำ ${tg.floor} kcal เพื่อความปลอดภัย)</span>` : ''}<br>
        <b>โปรตีน</b> = ${p.weight} กก. × ${tg.goal.proteinPerKg} g = <b>${fmt(tg.protein)}</b> g<br>
        <b>ไขมัน</b> = 25% ของแคล ÷ 9 = <b>${fmt(tg.fat)}</b> g · <b>คาร์บ</b> = ส่วนที่เหลือ ÷ 4 = <b>${fmt(tg.carb)}</b> g
      </div>
    </details>
  </section>

  <section class="card col">
    <h3 style="font-size:17px">7 วันล่าสุด</h3>
    ${days.map((k) => {
      const t = totals(k);
      const pct = clamp((t.kcal / tg.kcal) * 100, 0, 100);
      const over = t.kcal > tg.kcal + (db.settings.countBurned ? t.burned : 0);
      return `<div class="row">
        <span class="small" style="width:64px">${esc(dateLabel(k))}</span>
        <div class="bar grow"><i style="width:${pct}%;background:${over ? 'var(--berry)' : 'var(--leaf)'}"></i></div>
        <span class="tiny muted" style="width:92px;text-align:right">${fmt(t.kcal)} kcal · ${fmt(t.p)}g</span>
      </div>`;
    }).join('')}
  </section>

  <section class="card col">
    <label class="row between"><span>นับแคลที่เผาผลาญเพิ่มในงบวันนั้น<div class="tiny muted">ออกกำลังแล้วกินเพิ่มได้ตามที่เผาไป</div></span>
      <span class="switch"><input type="checkbox" data-setting="countBurned" ${db.settings.countBurned ? 'checked' : ''}><span></span></span></label>
    <label class="row between"><span>เสียงจับเวลาตอนออกกำลัง</span>
      <span class="switch"><input type="checkbox" data-setting="sound" ${db.settings.sound ? 'checked' : ''}><span></span></span></label>
  </section>

  <button class="btn ghost block" data-act="reset-ask" style="color:var(--berry)">ล้างข้อมูลทั้งหมด</button>
  <p class="tiny muted center">ข้อมูลทั้งหมดเก็บไว้ในเครื่องนี้เท่านั้น · ค่าโภชนาการและแคลที่เผาผลาญเป็นค่าประมาณ</p>`;
}

/* =========================================================
   Screens: Onboarding / edit profile
   ========================================================= */
function defaultForm() {
  return db.profile
    ? { ...db.profile, step: 1, editing: true }
    : { name: '', buddy: 'panda', sex: 'm', age: '', weight: '', height: '', activity: 'moderate', goal: 'lose', step: 1, editing: false };
}

function screenOnboard() {
  const f = ui.form;
  if (f.step === 2) {
    const tg = targets(f);
    const bd = buddyOf(f);
    return `
      <div class="hero-emo" style="margin-top:20px">${bd.emoji}</div>
      <h1 class="center" style="font-size:24px">พร้อมลุยแล้ว!</h1>
      <p class="center muted" style="margin:-6px 0 0">${bd.name}คำนวณเป้าหมายต่อวันให้แล้ว</p>
      <section class="card col">
        <div class="grid2">
          <div class="macro c-leaf"><span class="lbl">🔥 แคลอรี่</span><span class="num">${fmt(tg.kcal)} kcal</span></div>
          <div class="macro c-berry"><span class="lbl">🥩 โปรตีน</span><span class="num">${fmt(tg.protein)} g</span></div>
          <div class="macro c-sun"><span class="lbl">🍚 คาร์บ</span><span class="num">${fmt(tg.carb)} g</span></div>
          <div class="macro c-sky"><span class="lbl">🥑 ไขมัน</span><span class="num">${fmt(tg.fat)} g</span></div>
        </div>
        <div class="formula">BMR ${fmt(tg.bmr)} kcal → TDEE ${fmt(tg.tdee)} kcal (${tg.act.label})<br>
        เป้าหมาย "${tg.goal.label}" ${tg.goal.kcalDelta >= 0 ? '+' : '−'}${Math.abs(tg.goal.kcalDelta)} kcal · โปรตีน ${tg.goal.proteinPerKg} g/กก.
        ${tg.floorApplied ? `<br><span class="muted">ปรับเป้าแคลขึ้นเป็นขั้นต่ำ ${tg.floor} kcal เพื่อความปลอดภัย</span>` : ''}</div>
      </section>
      <div class="col" style="margin-top:auto">
        <button class="btn leaf block" data-act="ob-save">${f.editing ? 'บันทึก' : 'เริ่มเลย 🐾'}</button>
        <button class="btn ghost block" data-act="ob-back">ย้อนกลับไปแก้ไข</button>
      </div>`;
  }
  const chip = (field, val, label) => `<button class="chip ${String(f[field]) === String(val) ? 'on' : ''}" data-act="ob-set" data-field="${field}" data-v="${val}">${label}</button>`;
  return `
    <header class="topbar">
      <div><div class="muted small">${f.editing ? 'แก้ไขโปรไฟล์' : 'ยินดีต้อนรับสู่'}</div><h1>${f.editing ? 'ข้อมูลของคุณ' : 'Healthy Zoo 🐾'}</h1></div>
      ${f.editing ? '<button class="icon-btn" data-act="screen-close" aria-label="ปิด">✕</button>' : ''}
    </header>
    ${f.editing ? '' : '<p class="muted" style="margin:-6px 0 0">ตอบไม่กี่ข้อ แล้วเราจะคำนวณแคลอรี่และโปรตีนที่เหมาะกับคุณ</p>'}

    <div class="field"><span class="label">เลือกสัตว์คู่หู</span>
      <div class="choice-grid" style="grid-template-columns:repeat(4,1fr)">
        ${BUDDIES.map((b) => `<button class="choice ${f.buddy === b.id ? 'on' : ''}" data-act="ob-set" data-field="buddy" data-v="${b.id}"><span class="emo">${b.emoji}</span><span class="tiny">${b.name}</span></button>`).join('')}
      </div>
    </div>

    <div class="field"><label for="ob-name">ชื่อเล่น</label>
      <input id="ob-name" class="input" data-input="name" value="${esc(f.name)}" placeholder="ต้น" maxlength="20" autocomplete="nickname"></div>

    <div class="field"><span class="label">เพศ</span><div class="row">${chip('sex', 'm', '👨 ชาย')}${chip('sex', 'f', '👩 หญิง')}</div></div>

    <div class="grid3">
      <div class="field"><label for="ob-age">อายุ</label><div class="input-unit"><input id="ob-age" class="input" type="number" inputmode="numeric" data-input="age" value="${esc(f.age)}" placeholder="30"><span>ปี</span></div></div>
      <div class="field"><label for="ob-w">น้ำหนัก</label><div class="input-unit"><input id="ob-w" class="input" type="number" inputmode="decimal" data-input="weight" value="${esc(f.weight)}" placeholder="65"><span>กก.</span></div></div>
      <div class="field"><label for="ob-h">ส่วนสูง</label><div class="input-unit"><input id="ob-h" class="input" type="number" inputmode="numeric" data-input="height" value="${esc(f.height)}" placeholder="170"><span>ซม.</span></div></div>
    </div>

    <div class="field"><span class="label">ระดับกิจกรรมต่อวัน</span>
      <div class="choice-grid" style="grid-template-columns:1fr 1fr">
        ${ACTIVITY_LEVELS.map((a) => `<button class="choice ${f.activity === a.id ? 'on' : ''}" data-act="ob-set" data-field="activity" data-v="${a.id}"><span class="emo">${a.emoji}</span><b>${a.label}</b><span class="tiny">${a.desc}</span></button>`).join('')}
      </div>
    </div>

    <div class="field"><span class="label">เป้าหมาย</span>
      <div class="choice-grid" style="grid-template-columns:repeat(3,1fr)">
        ${GOALS.map((g) => `<button class="choice ${f.goal === g.id ? 'on' : ''}" data-act="ob-set" data-field="goal" data-v="${g.id}"><span class="emo">${g.emoji}</span>${g.label}</button>`).join('')}
      </div>
    </div>

    <div id="ob-error" class="error"></div>
    <button class="btn block" data-act="ob-calc">คำนวณเป้าหมาย</button>`;
}

function validateForm(f) {
  const age = Number(f.age), w = Number(f.weight), h = Number(f.height);
  if (!f.age || age < 13 || age > 100) return 'กรอกอายุ 13–100 ปี';
  if (!f.weight || w < 30 || w > 250) return 'กรอกน้ำหนัก 30–250 กก.';
  if (!f.height || h < 120 || h > 230) return 'กรอกส่วนสูง 120–230 ซม.';
  return '';
}

/* =========================================================
   Screens: Program detail
   ========================================================= */
function screenProgram() {
  const p = PROGRAMS.find((x) => x.id === ui.screen.id);
  const s = programStats(p);
  const unit = p.mode === 'sets' ? 'เซต' : 'รอบ';
  return `
    <header class="topbar"><button class="icon-btn" data-act="screen-close" aria-label="กลับ">‹</button><span class="badge c-${p.color}">${LEVEL_LABELS[p.level]}</span></header>
    <section class="card col center c-${p.color}" style="border-color:transparent">
      <div class="hero-emo">${p.emoji}</div>
      <h1 style="font-size:24px">${p.name}</h1>
      <div class="small" style="margin-top:-8px">${p.en}</div>
      <p class="small" style="margin:0">${p.desc}</p>
    </section>
    <section class="grid3 center">
      <div class="card"><div style="font-size:24px;font-weight:500">${s.min}</div><div class="tiny muted">นาที</div></div>
      <div class="card"><div style="font-size:24px;font-weight:500">${s.n}</div><div class="tiny muted">ท่า</div></div>
      <div class="card"><div style="font-size:24px;font-weight:500">${s.sets}</div><div class="tiny muted">${unit}</div></div>
    </section>
    <div class="formula">
      🔥 เผาผลาญประมาณ <b>${fmt(s.kcal)} kcal</b> · พักระหว่าง${unit} <b>${p.rest} วินาที</b><br>
      ${p.mode === 'sets' ? `ทำท่าเดิมให้ครบ ${s.sets} เซตก่อน แล้วค่อยเปลี่ยนท่า` : `ทำทุกท่าต่อกันเป็น 1 รอบ แล้ววนซ้ำ ${s.sets} รอบ`}
    </div>
    <section class="card">
      ${p.exercises.map((ex, i) => `
        <details class="ex-row" style="display:block">
          <summary class="row">
            <span class="num">${i + 1}</span><span class="emo">${ex.emoji}</span>
            <div class="grow"><div style="font-weight:400">${ex.th}</div><div class="tiny muted">${ex.name}</div></div>
            <b class="small">${s.sets} × ${ex.type === 'time' ? ex.amount + ' วิ' : ex.amount}</b>
          </summary>
          <div class="tiny muted" style="padding:6px 0 0 70px">💡 ${ex.tip}</div>
        </details>`).join('')}
    </section>
    <button class="btn leaf block" data-act="prog-start" style="position:sticky;bottom:calc(16px + env(safe-area-inset-bottom))">▶ เริ่มออกกำลัง</button>`;
}

/* =========================================================
   Workout session
   ========================================================= */
function buildSteps(prog) {
  const steps = [{ kind: 'ready', dur: 5, ex: prog.exercises[0], exIdx: 0, set: 1 }];
  const n = prog.exercises.length, S = prog.sets;
  const order = [];
  if (prog.mode === 'sets') { for (let i = 0; i < n; i++) for (let s = 1; s <= S; s++) order.push([i, s]); }
  else { for (let s = 1; s <= S; s++) for (let i = 0; i < n; i++) order.push([i, s]); }
  order.forEach(([i, s], k) => {
    const ex = prog.exercises[i];
    steps.push({ kind: 'work', ex, exIdx: i, set: s, dur: ex.type === 'time' ? ex.amount : null });
    if (k < order.length - 1) {
      const [ni, ns] = order[k + 1];
      steps.push({ kind: 'rest', dur: prog.rest, ex: prog.exercises[ni], exIdx: ni, set: ns });
    }
  });
  return steps;
}

let sessTimer = null;
let wakeLock = null;

async function startSession(progId) {
  const prog = PROGRAMS.find((p) => p.id === progId);
  ui.session = { prog, steps: buildSteps(prog), idx: 0, paused: false, activeMs: 0, lastTick: Date.now(), endAt: 0, remaining: 0, stepStart: Date.now(), lastBeep: null };
  ui.screen = { type: 'session' };
  enterStep();
  renderScreen(true);
  clearInterval(sessTimer);
  sessTimer = setInterval(tick, 200);
  requestWakeLock();
}

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock?.request('screen');
    wakeLock?.addEventListener('release', () => { wakeLock = null; });
  } catch { /* ไม่รองรับ */ }
}

function enterStep() {
  const s = ui.session;
  const st = s.steps[s.idx];
  s.stepStart = Date.now();
  s.endAt = st.dur ? Date.now() + st.dur * 1000 : 0;
  s.lastBeep = null;
  if (st.kind === 'work') { beep(990, 180); vibrate(120); }
  if (st.kind === 'rest') { beep(520, 160); vibrate([60, 60, 60]); }
}

function tick() {
  const s = ui.session;
  if (!s) return;
  const now = Date.now();
  const st = s.steps[s.idx];
  if (!s.paused && st.kind !== 'ready') s.activeMs += now - s.lastTick;
  s.lastTick = now;
  if (s.paused) return;
  const el = $('#sess-count');
  if (st.dur) {
    const rem = Math.ceil((s.endAt - now) / 1000);
    if (el) el.textContent = st.kind === 'work' ? mmss(Math.max(0, rem)) : Math.max(0, rem);
    if (rem <= 3 && rem > 0 && s.lastBeep !== rem) { s.lastBeep = rem; beep(660, 90); }
    if (rem <= 0) sessNext();
  } else {
    const sub = $('#sess-elapsed');
    if (sub) sub.textContent = `เวลา ${mmss((now - s.stepStart) / 1000)}`;
  }
  const tot = $('#sess-total');
  if (tot) tot.textContent = mmss(s.activeMs / 1000);
}

function sessNext() {
  const s = ui.session;
  if (s.idx >= s.steps.length - 1) { finishSession(false); return; }
  s.idx++;
  enterStep();
  renderScreen();
}

function sessPrev() {
  const s = ui.session;
  let i = s.idx - 1;
  while (i > 0 && s.steps[i].kind !== 'work') i--;
  if (i < 1) i = 1;
  s.idx = i;
  s.paused = false;
  enterStep();
  renderScreen();
}

function sessTogglePause() {
  const s = ui.session;
  const st = s.steps[s.idx];
  if (s.paused) {
    s.paused = false;
    if (st.dur) s.endAt = Date.now() + s.remaining;
    s.stepStart = Date.now() - (s.pausedElapsed || 0);
    s.lastTick = Date.now();
  } else {
    s.paused = true;
    if (st.dur) s.remaining = s.endAt - Date.now();
    s.pausedElapsed = Date.now() - s.stepStart;
  }
  renderScreen();
}

function stopSessionTimer() {
  clearInterval(sessTimer); sessTimer = null;
  try { wakeLock?.release(); } catch { /* ignore */ } wakeLock = null;
}

function finishSession(early) {
  const s = ui.session;
  stopSessionTimer();
  const doneSets = s.steps.slice(1, early ? s.idx : s.steps.length).filter((x) => x.kind === 'work').length;
  const min = Math.max(1, Math.round(s.activeMs / 60000));
  const kcal = s.prog.met * db.profile.weight * (s.activeMs / 3600000);
  ui.sheet = null;
  ui.screen = { type: 'summary', prog: s.prog, min, kcal: Math.max(1, Math.round(kcal)), doneSets, totalSets: s.steps.filter((x) => x.kind === 'work').length, early };
  ui.session = null;
  beep(880, 120); setTimeout(() => beep(1175, 220), 140);
  vibrate([100, 50, 100, 50, 200]);
  renderOverlay(true);
}

function screenSession() {
  const s = ui.session;
  const st = s.steps[s.idx];
  const p = s.prog;
  const unit = p.mode === 'sets' ? 'เซต' : 'รอบ';
  const works = s.steps.map((x, i) => ({ x, i })).filter((o) => o.x.kind === 'work');
  const workNo = works.filter((o) => o.i < s.idx || (o.i === s.idx)).length;
  const dots = works.map((o) => `<i class="${o.i < s.idx ? 'done' : o.i === s.idx ? 'cur' : ''}"></i>`).join('');

  let stage;
  if (st.kind === 'ready') {
    stage = `<div class="tiny muted">เตรียมตัว</div>
      <div class="big-emo">${p.emoji}</div>
      <div class="count" id="sess-count">${Math.ceil(st.dur)}</div>
      <div class="ex-name">ท่าแรก: ${st.ex.th}</div>
      <div class="small muted">${st.ex.tip}</div>`;
  } else if (st.kind === 'rest') {
    stage = `<div class="small" style="color:var(--sky);font-weight:500">พักหายใจ 😮‍💨</div>
      <div class="big-emo">${st.ex.emoji}</div>
      <div class="count" id="sess-count">${st.dur}</div>
      <div class="small muted">ถัดไป · ${unit} ${st.set}/${p.sets}</div>
      <div class="ex-name">${st.ex.th}</div>
      <div class="small muted">${st.ex.type === 'time' ? st.ex.amount + ' วินาที' : st.ex.amount + ' ครั้ง'}</div>`;
  } else {
    stage = `<div class="small muted">${unit} ${st.set}/${p.sets} · ท่าที่ ${st.exIdx + 1}/${p.exercises.length}</div>
      <div class="big-emo">${st.ex.emoji}</div>
      <div class="ex-name">${st.ex.th}</div>
      <div class="tiny muted" style="margin-top:-6px">${st.ex.name}</div>
      <div class="count" id="sess-count">${st.dur ? mmss(st.dur) : '× ' + st.ex.amount}</div>
      ${st.dur ? '' : '<div class="small muted" id="sess-elapsed">เวลา 0:00</div>'}
      <div class="small muted" style="max-width:320px">💡 ${st.ex.tip}</div>`;
  }

  const mainBtn = st.kind === 'work' && !st.dur
    ? `<button class="btn leaf block" data-act="sess-next">✓ เสร็จ${unit}นี้</button>`
    : st.kind === 'rest' || st.kind === 'ready'
      ? `<button class="btn ghost block" data-act="sess-next">ข้าม ›</button>`
      : `<button class="btn ghost block" data-act="sess-next">ข้ามท่านี้ ›</button>`;

  return `<div class="session ${st.kind === 'rest' ? 'rest' : ''}">
    <header class="topbar">
      <button class="icon-btn" data-act="sess-exit" aria-label="ออก">✕</button>
      <div class="center"><div class="tiny muted">${p.emoji} ${p.name}</div><b id="sess-total">${mmss(s.activeMs / 1000)}</b></div>
      <span class="small muted" style="width:40px;text-align:right">${workNo}/${works.length}</span>
    </header>
    <div class="progress-dots">${dots}</div>
    <div class="stage">${stage}</div>
    ${s.paused ? '<div class="center" style="color:var(--fox);font-weight:500">⏸ หยุดชั่วคราว</div>' : ''}
    <div class="controls">
      <button class="icon-btn" data-act="sess-prev" aria-label="ท่าก่อนหน้า">⏮</button>
      <button class="icon-btn" data-act="sess-pause" aria-label="${s.paused ? 'เล่นต่อ' : 'หยุด'}">${s.paused ? '▶' : '⏸'}</button>
      <button class="icon-btn" data-act="sess-next" aria-label="ถัดไป">⏭</button>
    </div>
    ${mainBtn}
  </div>`;
}

function screenSummary() {
  const s = ui.screen;
  const bd = buddyOf();
  return `
    <div class="confetti" style="margin-top:24px">🎉 🐾 ✨</div>
    <div class="hero-emo">${bd.emoji}</div>
    <h1 class="center" style="font-size:26px">${s.early ? 'ทำได้ดีแล้ว!' : 'สุดยอดไปเลย!'}</h1>
    <p class="center muted" style="margin:-6px 0 0">${s.early ? 'ทุกการขยับมีค่าเสมอ' : `จบโปรแกรม ${s.prog.name} ครบทุก${s.prog.mode === 'sets' ? 'เซต' : 'รอบ'}`}</p>
    <section class="grid3 center">
      <div class="card"><div style="font-size:24px;font-weight:500">${s.min}</div><div class="tiny muted">นาที</div></div>
      <div class="card"><div style="font-size:24px;font-weight:500">${fmt(s.kcal)}</div><div class="tiny muted">kcal</div></div>
      <div class="card"><div style="font-size:24px;font-weight:500">${s.doneSets}/${s.totalSets}</div><div class="tiny muted">เซต</div></div>
    </section>
    <div class="col" style="margin-top:auto">
      <button class="btn leaf block" data-act="summary-save">บันทึกลงวันนี้</button>
      <button class="btn ghost block" data-act="screen-close">ไม่บันทึก</button>
    </div>`;
}

/* =========================================================
   Sheets
   ========================================================= */
function sheetAddFood() {
  const meal = MEALS.find((m) => m.id === ui.sheet.meal);
  return `
    <div class="row between"><h3>เพิ่มใน${meal.label} ${meal.emoji}</h3><button class="icon-btn" data-act="sheet-close" aria-label="ปิด">✕</button></div>
    <div class="chips">${MEALS.map((m) => `<button class="chip ${m.id === meal.id ? 'on' : ''}" data-act="meal-switch" data-v="${m.id}">${m.emoji} ${m.label}</button>`).join('')}</div>
    <div class="search"><input class="input" id="food-search" data-input="foodQuery" placeholder="ค้นหา เช่น อกไก่" value="${esc(ui.foodQuery)}" autocomplete="off"></div>
    <div class="chips">${FOOD_CATEGORIES.map((c) => `<button class="chip ${ui.foodCat === c.id ? 'on' : ''}" data-act="food-cat" data-v="${c.id}">${c.label}</button>`).join('')}</div>
    <button class="btn ghost small" data-act="custom-open">✍️ กรอกอาหารเอง</button>
    <div id="food-list" class="card list">${foodListHTML()}</div>`;
}

function foodListHTML() {
  const q = ui.foodQuery.trim().toLowerCase();
  let list = allFoods().filter((f) => (ui.foodCat === 'all' || f.cat === ui.foodCat) && (!q || f.name.toLowerCase().includes(q)));
  let recentHTML = '';
  if (!q && ui.foodCat === 'all' && db.recent.length) {
    const rec = db.recent.map(findFood).filter(Boolean).slice(0, 5);
    if (rec.length) {
      recentHTML = `<div class="tiny muted" style="padding:4px 0">🕘 ล่าสุด</div>${rec.map(foodRow).join('')}<div class="tiny muted" style="padding:10px 0 4px;border-top:1.5px dashed var(--line)">ทั้งหมด</div>`;
    }
  }
  if (!list.length) {
    return `<div class="empty">🦔 ไม่พบ "${esc(ui.foodQuery)}"<br><button class="btn small" style="margin-top:8px" data-act="custom-open">กรอกเอง</button></div>`;
  }
  return recentHTML + list.map(foodRow).join('');
}

function foodRow(f) {
  return `<button class="item" style="width:100%;text-align:left" data-act="food-pick" data-id="${f.id}">
    <div class="emo">${catEmoji[f.cat] || '🍽️'}</div>
    <div class="grow"><div class="name">${esc(f.name)}</div><div class="tiny muted">${esc(f.unit)} · P ${r1(f.p)} · C ${r1(f.c)} · F ${r1(f.f)}</div></div>
    <b>${fmt(f.kcal)}</b><span class="tiny muted">kcal</span>
  </button>`;
}

function sheetFoodQty() {
  const f = findFood(ui.sheet.id);
  const q = ui.sheet.qty;
  return `
    <div class="row between"><button class="icon-btn" data-act="qty-back" aria-label="กลับ">‹</button><button class="icon-btn" data-act="sheet-close" aria-label="ปิด">✕</button></div>
    <div class="center"><div style="font-size:48px">${catEmoji[f.cat] || '🍽️'}</div><h3 style="font-size:20px">${esc(f.name)}</h3><div class="small muted">ต่อ ${esc(f.unit)}</div></div>
    <div class="stepper">
      <button data-act="qty-dec" aria-label="ลด">−</button>
      <div class="val">${r1(q)}</div>
      <button data-act="qty-inc" aria-label="เพิ่ม">+</button>
    </div>
    <div class="grid2 center" style="grid-template-columns:repeat(4,1fr)">
      <div class="macro c-leaf"><span class="tiny">kcal</span><b>${fmt(f.kcal * q)}</b></div>
      <div class="macro c-berry"><span class="tiny">โปรตีน</span><b>${r1(f.p * q)}</b></div>
      <div class="macro c-sun"><span class="tiny">คาร์บ</span><b>${r1(f.c * q)}</b></div>
      <div class="macro c-sky"><span class="tiny">ไขมัน</span><b>${r1(f.f * q)}</b></div>
    </div>
    <button class="btn leaf block" data-act="qty-add">เพิ่มลง${MEALS.find((m) => m.id === ui.sheet.meal).label}</button>`;
}

function sheetCustom() {
  const c = ui.sheet.form;
  const inp = (key, label, ph, unit, mode = 'decimal') => `<div class="field"><label for="cf-${key}">${label}</label><div class="input-unit"><input id="cf-${key}" class="input" type="number" inputmode="${mode}" data-input="custom.${key}" value="${esc(c[key])}" placeholder="${ph}"><span>${unit}</span></div></div>`;
  return `
    <div class="row between"><h3>✍️ กรอกอาหารเอง</h3><button class="icon-btn" data-act="sheet-close" aria-label="ปิด">✕</button></div>
    <div class="field"><label for="cf-name">ชื่ออาหาร</label><input id="cf-name" class="input" data-input="custom.name" value="${esc(c.name)}" placeholder="ข้าวไข่เจียวหมูสับ" maxlength="60"></div>
    <div class="field"><label for="cf-unit">หน่วยบริโภค</label><input id="cf-unit" class="input" data-input="custom.unit" value="${esc(c.unit)}" placeholder="1 จาน" maxlength="30"></div>
    <div class="grid2">
      ${inp('kcal', 'พลังงาน', '450', 'kcal', 'numeric')}
      ${inp('p', 'โปรตีน', '20', 'g')}
      ${inp('c', 'คาร์บ', '50', 'g')}
      ${inp('f', 'ไขมัน', '15', 'g')}
    </div>
    <label class="row"><input type="checkbox" data-input="custom.keep" ${c.keep ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--leaf)"> <span class="small">บันทึกไว้ใน "ของฉัน" ใช้ครั้งหน้า</span></label>
    <div id="cf-error" class="error"></div>
    <button class="btn leaf block" data-act="custom-save">เพิ่มลง${MEALS.find((m) => m.id === ui.sheet.meal).label}</button>`;
}

function sheetQuick() {
  const sh = ui.sheet;
  const act = QUICK_ACTIVITIES.find((a) => a.id === sh.act);
  const kcal = act.met * db.profile.weight * (sh.min / 60);
  return `
    <div class="row between"><h3>บันทึกกิจกรรม</h3><button class="icon-btn" data-act="sheet-close" aria-label="ปิด">✕</button></div>
    <div class="choice-grid" style="grid-template-columns:repeat(4,1fr)">
      ${QUICK_ACTIVITIES.map((a) => `<button class="choice ${a.id === sh.act ? 'on' : ''}" data-act="quick-pick" data-v="${a.id}"><span class="emo">${a.emoji}</span><span class="tiny" style="color:inherit">${a.label}</span></button>`).join('')}
    </div>
    <div class="label center">ระยะเวลา (นาที)</div>
    <div class="stepper">
      <button data-act="quick-min" data-v="-5" aria-label="ลด 5 นาที">−</button>
      <div class="val">${sh.min}</div>
      <button data-act="quick-min" data-v="5" aria-label="เพิ่ม 5 นาที">+</button>
    </div>
    <div class="formula center">🔥 เผาผลาญประมาณ <b>${fmt(kcal)} kcal</b><br><span class="tiny muted">MET ${act.met} × ${db.profile.weight} กก. × ${r1(sh.min / 60)} ชม.</span></div>
    <button class="btn leaf block" data-act="quick-save">บันทึกลงวันนี้</button>`;
}

function sheetExit() {
  const s = ui.session;
  const hasProgress = s.activeMs > 30000;
  return `
    <div class="center"><div style="font-size:48px">🥺</div><h3>จะออกจากการออกกำลังแล้วเหรอ?</h3>
    <p class="small muted" style="margin:4px 0 0">ทำไปแล้ว ${mmss(s.activeMs / 1000)} นาที</p></div>
    <button class="btn leaf block" data-act="sess-resume">ทำต่อ 💪</button>
    ${hasProgress ? '<button class="btn ghost block" data-act="sess-finish">จบและบันทึกเท่าที่ทำ</button>' : ''}
    <button class="btn ghost block" data-act="sess-quit" style="color:var(--berry)">ออกโดยไม่บันทึก</button>`;
}

function sheetReset() {
  return `
    <div class="center"><div style="font-size:48px">🙀</div><h3>ล้างข้อมูลทั้งหมด?</h3>
    <p class="small muted" style="margin:4px 0 0">โปรไฟล์ บันทึกอาหาร และการออกกำลังทั้งหมดในเครื่องนี้จะถูกลบถาวร กู้คืนไม่ได้</p></div>
    <button class="btn block" data-act="reset-do" style="background:var(--berry);box-shadow:0 4px 0 #B03A5C">ลบทั้งหมด</button>
    <button class="btn ghost block" data-act="sheet-close">ยกเลิก</button>`;
}

/* =========================================================
   Rendering
   ========================================================= */
const app = $('#app');
const tabbar = $('#tabbar');
const overlay = $('#overlay');
overlay.innerHTML = '<div id="screen-root"></div><div id="sheet-root"></div>';
const screenRoot = $('#screen-root');
const sheetRoot = $('#sheet-root');

function render() {
  if (!db.profile) {
    app.innerHTML = '';
    tabbar.hidden = true;
    if (!ui.screen) { ui.form = defaultForm(); ui.screen = { type: 'onboard' }; }
    renderOverlay(true);
    return;
  }
  tabbar.hidden = false;
  tabbar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
  const views = { home: viewHome, food: viewFood, workout: viewWorkout, me: viewMe };
  app.innerHTML = views[ui.tab]();
}

function renderScreen(animate = false) {
  if (!ui.screen) { screenRoot.innerHTML = ''; document.body.style.overflow = ui.sheet ? 'hidden' : ''; return; }
  const fns = { onboard: screenOnboard, program: screenProgram, session: screenSession, summary: screenSummary };
  screenRoot.innerHTML = `<div class="screen" style="${animate ? '' : 'animation:none'}"><div class="inner">${fns[ui.screen.type]()}</div></div>`;
  document.body.style.overflow = 'hidden';
}

function renderSheet() {
  if (!ui.sheet) { sheetRoot.innerHTML = ''; if (!ui.screen) document.body.style.overflow = ''; return; }
  const fns = { addFood: sheetAddFood, foodQty: sheetFoodQty, custom: sheetCustom, quick: sheetQuick, exit: sheetExit, reset: sheetReset };
  const keepScroll = sheetRoot.querySelector('.sheet')?.scrollTop || 0;
  const sameType = sheetRoot.dataset.type === ui.sheet.type;
  sheetRoot.dataset.type = ui.sheet.type;
  sheetRoot.innerHTML = `<div class="backdrop" data-act="sheet-close" style="${sameType ? 'animation:none' : ''}"></div>
    <div class="sheet" role="dialog" aria-modal="true" style="${sameType ? 'animation:none' : ''}"><div class="grabber"></div>${fns[ui.sheet.type]()}</div>`;
  if (sameType) sheetRoot.querySelector('.sheet').scrollTop = keepScroll;
  document.body.style.overflow = 'hidden';
}

function renderOverlay(animate = false) {
  renderScreen(animate);
  renderSheet();
}

function openSheet(sheet) {
  sheetRoot.dataset.type = '';
  ui.sheet = sheet;
  renderSheet();
}
function closeSheet() {
  ui.sheet = null;
  sheetRoot.dataset.type = '';
  renderSheet();
}
function closeScreen() {
  ui.screen = null;
  renderScreen();
  render();
}

/* =========================================================
   Actions
   ========================================================= */
function addFoodItem(meal, food, qty) {
  const d = ensureDay(ui.date);
  d.meals[meal].push({ uid: uid(), name: food.name, unit: food.unit, kcal: Number(food.kcal) || 0, p: Number(food.p) || 0, c: Number(food.c) || 0, f: Number(food.f) || 0, qty });
  if (food.id) db.recent = [food.id, ...db.recent.filter((x) => x !== food.id)].slice(0, 12);
  save();
  render();
}

const actions = {
  tab(el) { ui.tab = el.dataset.v || el.dataset.tab; window.scrollTo(0, 0); render(); },
  'date-prev'() { ui.date = shiftKey(ui.date, -1); render(); },
  'date-next'() { if (ui.date < todayKey()) { ui.date = shiftKey(ui.date, 1); render(); } },
  'date-today'() { ui.date = todayKey(); render(); },

  'add-food'(el) { ui.foodQuery = ''; ui.foodCat = 'all'; openSheet({ type: 'addFood', meal: el.dataset.meal }); },
  'meal-switch'(el) { ui.sheet.meal = el.dataset.v; renderSheet(); },
  'food-cat'(el) { ui.foodCat = el.dataset.v; renderSheet(); },
  'food-pick'(el) { openSheet({ type: 'foodQty', id: el.dataset.id, qty: 1, meal: ui.sheet.meal }); },
  'qty-inc'() { ui.sheet.qty = Math.min(10, ui.sheet.qty + 0.5); renderSheet(); },
  'qty-dec'() { ui.sheet.qty = Math.max(0.5, ui.sheet.qty - 0.5); renderSheet(); },
  'qty-back'() { openSheet({ type: 'addFood', meal: ui.sheet.meal }); },
  'qty-add'() {
    const f = findFood(ui.sheet.id);
    const meal = ui.sheet.meal;
    addFoodItem(meal, f, ui.sheet.qty);
    closeSheet();
    toast(`เพิ่ม ${f.name} แล้ว 🐾`);
  },
  'custom-open'() {
    openSheet({ type: 'custom', meal: ui.sheet.meal, form: { name: ui.foodQuery || '', unit: '1 จาน', kcal: '', p: '', c: '', f: '', keep: true } });
  },
  'custom-save'() {
    const c = ui.sheet.form;
    const err = $('#cf-error');
    if (!c.name.trim()) { err.textContent = 'ใส่ชื่ออาหารก่อน'; return; }
    if (c.kcal === '' || Number(c.kcal) < 0 || Number(c.kcal) > 5000) { err.textContent = 'ใส่พลังงาน 0–5000 kcal'; return; }
    for (const k of ['p', 'c', 'f']) if (c[k] !== '' && (Number(c[k]) < 0 || Number(c[k]) > 500)) { err.textContent = 'สารอาหารต้องอยู่ระหว่าง 0–500 g'; return; }
    const food = { cat: 'mine', name: c.name.trim(), unit: c.unit.trim() || '1 ที่', kcal: Number(c.kcal), p: Number(c.p) || 0, c: Number(c.c) || 0, f: Number(c.f) || 0 };
    if (c.keep) { food.id = 'u' + uid(); db.customFoods.push(food); }
    addFoodItem(ui.sheet.meal, food, 1);
    closeSheet();
    toast(`เพิ่ม ${food.name} แล้ว 🐾`);
  },
  'del-food'(el) {
    const d = ensureDay(ui.date);
    d.meals[el.dataset.meal] = d.meals[el.dataset.meal].filter((x) => x.uid !== el.dataset.id);
    save(); render(); toast('ลบแล้ว');
  },
  'del-workout'(el) {
    const d = ensureDay(ui.date);
    d.workouts = d.workouts.filter((x) => x.uid !== el.dataset.id);
    save(); render(); toast('ลบแล้ว');
  },

  'prog-tag'(el) { ui.progTag = el.dataset.v; render(); },
  'prog-open'(el) { ui.screen = { type: 'program', id: el.dataset.id }; renderScreen(true); },
  'prog-start'() { startSession(ui.screen.id); },
  'sess-next'() { sessNext(); },
  'sess-prev'() { sessPrev(); },
  'sess-pause'() { sessTogglePause(); },
  'sess-exit'() { if (!ui.session.paused) sessTogglePause(); openSheet({ type: 'exit' }); },
  'sess-resume'() { closeSheet(); if (ui.session.paused) sessTogglePause(); },
  'sess-finish'() { finishSession(true); },
  'sess-quit'() { stopSessionTimer(); ui.session = null; ui.sheet = null; renderSheet(); closeScreen(); },
  'summary-save'() {
    const s = ui.screen;
    ensureDay(todayKey()).workouts.push({ uid: uid(), name: s.prog.name, emoji: s.prog.emoji, min: s.min, kcal: s.kcal, at: Date.now() });
    save();
    ui.date = todayKey(); ui.tab = 'home';
    closeScreen();
    toast(`บันทึก ${s.prog.name} แล้ว 🎉`);
  },

  'quick-open'() { openSheet({ type: 'quick', act: 'walk', min: 30 }); },
  'quick-pick'(el) { ui.sheet.act = el.dataset.v; renderSheet(); },
  'quick-min'(el) { ui.sheet.min = clamp(ui.sheet.min + Number(el.dataset.v), 5, 300); renderSheet(); },
  'quick-save'() {
    const sh = ui.sheet;
    const a = QUICK_ACTIVITIES.find((x) => x.id === sh.act);
    const kcal = Math.round(a.met * db.profile.weight * (sh.min / 60));
    ensureDay(todayKey()).workouts.push({ uid: uid(), name: a.label, emoji: a.emoji, min: sh.min, kcal, at: Date.now() });
    save(); closeSheet(); render();
    toast(`บันทึก ${a.label} ${sh.min} นาทีแล้ว`);
  },

  'ob-set'(el) {
    ui.form[el.dataset.field] = el.dataset.v;
    renderScreen();
  },
  'ob-calc'() {
    const err = validateForm(ui.form);
    if (err) { $('#ob-error').textContent = err; return; }
    ui.form.step = 2; renderScreen(); screenRoot.querySelector('.screen').scrollTop = 0;
  },
  'ob-back'() { ui.form.step = 1; renderScreen(); },
  'ob-save'() {
    const f = ui.form;
    db.profile = { name: f.name.trim(), buddy: f.buddy, sex: f.sex, age: Number(f.age), weight: Number(f.weight), height: Number(f.height), activity: f.activity, goal: f.goal };
    save();
    const wasEditing = f.editing;
    ui.form = null;
    closeScreen();
    toast(wasEditing ? 'บันทึกโปรไฟล์แล้ว' : `${buddyOf().emoji} ยินดีที่ได้รู้จัก!`);
  },
  'edit-profile'() { ui.form = defaultForm(); ui.screen = { type: 'onboard' }; renderScreen(true); },
  'screen-close'() { closeScreen(); },
  'sheet-close'() {
    if (ui.sheet?.type === 'exit') { actions['sess-resume'](); return; }
    closeSheet();
  },
  'reset-ask'() { openSheet({ type: 'reset' }); },
  'reset-do'() {
    localStorage.removeItem(STORE_KEY);
    Object.assign(db, { profile: null, days: {}, customFoods: [], recent: [], settings: { countBurned: true, sound: true } });
    ui.sheet = null; ui.screen = null; ui.tab = 'home'; ui.date = todayKey();
    renderSheet(); render();
  },
};

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) { actions.tab(tabBtn); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el); }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  const key = el.dataset.input;
  if (!key) return;
  const val = el.type === 'checkbox' ? el.checked : el.value;
  if (key === 'foodQuery') {
    ui.foodQuery = val;
    const list = $('#food-list');
    if (list) list.innerHTML = foodListHTML();
  } else if (key.startsWith('custom.')) {
    ui.sheet.form[key.slice(7)] = val;
    const err = $('#cf-error'); if (err) err.textContent = '';
  } else if (ui.form) {
    ui.form[key] = val;
    const err = $('#ob-error'); if (err) err.textContent = '';
  }
});

document.addEventListener('change', (e) => {
  const key = e.target.dataset.setting;
  if (!key) return;
  db.settings[key] = e.target.checked;
  save();
  render();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ui.sheet) actions['sheet-close']();
});

// กลับมาที่แอปหลังพักหน้าจอ: อัปเดตวันที่ถ้าข้ามวัน และขอ wake lock ใหม่ระหว่างออกกำลัง
let lastToday = todayKey();
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible') return;
  const t = todayKey();
  if (t !== lastToday) { if (ui.date === lastToday) ui.date = t; lastToday = t; if (!ui.screen) render(); }
  if (ui.session && !wakeLock) requestWakeLock();
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

render();
