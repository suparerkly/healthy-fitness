// ข้อมูลตั้งต้นของแอป: สัตว์คู่หู, อาหาร, โปรแกรมออกกำลังกาย
// ค่าโภชนาการเป็นค่าประมาณต่อ 1 หน่วยบริโภค (kcal, โปรตีน p, คาร์บ c, ไขมัน f เป็นกรัม)

export const BUDDIES = [
  { id: 'panda', emoji: '🐼', name: 'แพนด้า' },
  { id: 'fox', emoji: '🦊', name: 'จิ้งจอก' },
  { id: 'bunny', emoji: '🐰', name: 'กระต่าย' },
  { id: 'bear', emoji: '🐻', name: 'หมี' },
  { id: 'cat', emoji: '🐱', name: 'แมว' },
  { id: 'frog', emoji: '🐸', name: 'กบ' },
  { id: 'tiger', emoji: '🐯', name: 'เสือ' },
  { id: 'koala', emoji: '🐨', name: 'โคอาล่า' },
];

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', factor: 1.2, label: 'นั่งเป็นหลัก', desc: 'ทำงานโต๊ะ แทบไม่ออกกำลัง', emoji: '🦥' },
  { id: 'light', factor: 1.375, label: 'เบา', desc: 'ออกกำลัง 1–3 วัน/สัปดาห์', emoji: '🐢' },
  { id: 'moderate', factor: 1.55, label: 'ปานกลาง', desc: 'ออกกำลัง 3–5 วัน/สัปดาห์', emoji: '🐕' },
  { id: 'active', factor: 1.725, label: 'หนัก', desc: 'ออกกำลัง 6–7 วัน/สัปดาห์', emoji: '🐆' },
];

// เป้าหมายแบ่งเป็นกลุ่มและระดับ: kcalDelta = ปรับจาก TDEE, proteinPerKg = โปรตีนกรัมต่อน้ำหนักตัว 1 กก.
export const GOAL_GROUPS = [
  { id: 'lose', label: 'ลดไขมัน', emoji: '🔥' },
  { id: 'keep', label: 'รักษา / ปรับรูปร่าง', emoji: '⚖️' },
  { id: 'gain', label: 'เพิ่มกล้าม', emoji: '💪' },
];

export const GOALS = [
  { id: 'lose1', group: 'lose', level: 1, label: 'ลดไขมัน ระดับ 1', short: 'ระดับ 1', kcalDelta: -250, proteinPerKg: 1.8, emoji: '🔥', desc: 'ลดช้าแต่ยั่งยืน หิวน้อย รักษากล้ามได้ดี' },
  { id: 'lose2', group: 'lose', level: 2, label: 'ลดไขมัน ระดับ 2', short: 'ระดับ 2', kcalDelta: -500, proteinPerKg: 2.0, emoji: '🔥', desc: 'สมดุล เป็นแบบที่นิยมที่สุด' },
  { id: 'lose3', group: 'lose', level: 3, label: 'ลดไขมัน ระดับ 3', short: 'ระดับ 3', kcalDelta: -750, proteinPerKg: 2.2, emoji: '🔥', desc: 'ลดเร็ว ต้องมีวินัยสูง ไม่ควรทำนานเกิน 8–12 สัปดาห์' },
  { id: 'maintain', group: 'keep', level: 0, label: 'รักษาน้ำหนัก', short: 'รักษาน้ำหนัก', kcalDelta: 0, proteinPerKg: 1.6, emoji: '⚖️', desc: 'คงน้ำหนักและรูปร่างปัจจุบัน' },
  { id: 'recomp', group: 'keep', level: 0, label: 'ลดไขมัน + สร้างกล้าม', short: 'Recomp', kcalDelta: -150, proteinPerKg: 2.2, emoji: '🔄', desc: 'กินใกล้เคียง TDEE โปรตีนสูง ต้องเล่นเวทสม่ำเสมอ' },
  { id: 'gain1', group: 'gain', level: 1, label: 'เพิ่มกล้าม ระดับ 1', short: 'ระดับ 1', kcalDelta: 250, proteinPerKg: 1.8, emoji: '💪', desc: 'Lean bulk ไขมันขึ้นน้อย เหมาะกับคนส่วนใหญ่' },
  { id: 'gain2', group: 'gain', level: 2, label: 'เพิ่มกล้าม ระดับ 2', short: 'ระดับ 2', kcalDelta: 400, proteinPerKg: 2.0, emoji: '💪', desc: 'เพิ่มกล้ามมาตรฐาน น้ำหนักขึ้นต่อเนื่อง' },
  { id: 'gain3', group: 'gain', level: 3, label: 'เพิ่มกล้าม ระดับ 3', short: 'ระดับ 3', kcalDelta: 600, proteinPerKg: 2.2, emoji: '💪', desc: 'เพิ่มเร็ว เหมาะกับคนผอมมาก หรือน้ำหนักขึ้นยาก' },
];

// รหัสเป้าหมายจากเวอร์ชันก่อน
export const GOAL_ALIASES = { lose: 'lose2', gain: 'gain1' };

export const MEALS = [
  { id: 'breakfast', label: 'มื้อเช้า', emoji: '🐓' },
  { id: 'lunch', label: 'มื้อกลางวัน', emoji: '🦁' },
  { id: 'dinner', label: 'มื้อเย็น', emoji: '🦉' },
  { id: 'snack', label: 'ของว่าง', emoji: '🐿️' },
];

export const FOOD_CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'dish', label: 'จานเดียว' },
  { id: 'protein', label: 'โปรตีน' },
  { id: 'carb', label: 'แป้ง/ผลไม้' },
  { id: 'drink', label: 'เครื่องดื่ม/ขนม' },
  { id: 'mine', label: 'ของฉัน' },
];

export const FOODS = [
  // จานเดียว
  { id: 'f01', cat: 'dish', name: 'ข้าวมันไก่', unit: '1 จาน', kcal: 596, p: 25, c: 75, f: 22 },
  { id: 'f02', cat: 'dish', name: 'ผัดกะเพราหมูสับ + ข้าว', unit: '1 จาน', kcal: 580, p: 26, c: 65, f: 22 },
  { id: 'f03', cat: 'dish', name: 'ข้าวผัดหมู', unit: '1 จาน', kcal: 557, p: 20, c: 70, f: 21 },
  { id: 'f04', cat: 'dish', name: 'ผัดไทยกุ้งสด', unit: '1 จาน', kcal: 545, p: 20, c: 70, f: 20 },
  { id: 'f05', cat: 'dish', name: 'ข้าวขาหมู', unit: '1 จาน', kcal: 690, p: 27, c: 70, f: 33 },
  { id: 'f06', cat: 'dish', name: 'ก๋วยเตี๋ยวเส้นเล็กน้ำใส', unit: '1 ชาม', kcal: 300, p: 15, c: 42, f: 7 },
  { id: 'f07', cat: 'dish', name: 'โจ๊กหมู', unit: '1 ชาม', kcal: 250, p: 11, c: 35, f: 7 },
  { id: 'f08', cat: 'dish', name: 'ข้าวต้มปลา', unit: '1 ชาม', kcal: 220, p: 14, c: 30, f: 4 },
  { id: 'f09', cat: 'dish', name: 'สุกี้น้ำ', unit: '1 ชาม', kcal: 290, p: 20, c: 30, f: 9 },
  { id: 'f10', cat: 'dish', name: 'ส้มตำไทย', unit: '1 จาน', kcal: 120, p: 4, c: 22, f: 2 },
  { id: 'f11', cat: 'dish', name: 'ยำวุ้นเส้น', unit: '1 จาน', kcal: 150, p: 10, c: 20, f: 3 },
  { id: 'f12', cat: 'dish', name: 'ต้มยำกุ้งน้ำใส', unit: '1 ถ้วย', kcal: 110, p: 14, c: 6, f: 3 },
  { id: 'f13', cat: 'dish', name: 'แกงเขียวหวานไก่', unit: '1 ถ้วย', kcal: 240, p: 15, c: 8, f: 17 },
  { id: 'f14', cat: 'dish', name: 'สลัดผัก + น้ำสลัดใส', unit: '1 จาน', kcal: 150, p: 3, c: 10, f: 11 },
  { id: 'f15', cat: 'dish', name: 'ผักลวก/ผักต้ม', unit: '1 จาน', kcal: 50, p: 3, c: 9, f: 0.5 },
  // โปรตีน
  { id: 'p01', cat: 'protein', name: 'อกไก่ย่าง/ต้ม', unit: '100 g', kcal: 165, p: 31, c: 0, f: 3.6 },
  { id: 'p02', cat: 'protein', name: 'ไข่ต้ม', unit: '1 ฟอง', kcal: 75, p: 6.5, c: 0.5, f: 5 },
  { id: 'p03', cat: 'protein', name: 'ไข่ดาว', unit: '1 ฟอง', kcal: 110, p: 6, c: 0.5, f: 9 },
  { id: 'p04', cat: 'protein', name: 'ไข่เจียว', unit: '1 ฟอง', kcal: 170, p: 7, c: 1, f: 15 },
  { id: 'p05', cat: 'protein', name: 'ไก่ย่าง (น่อง)', unit: '1 ชิ้น', kcal: 165, p: 20, c: 2, f: 8 },
  { id: 'p06', cat: 'protein', name: 'หมูปิ้ง', unit: '1 ไม้', kcal: 95, p: 6, c: 4, f: 6 },
  { id: 'p07', cat: 'protein', name: 'ปลานิลนึ่ง', unit: '100 g', kcal: 130, p: 26, c: 0, f: 2.7 },
  { id: 'p08', cat: 'protein', name: 'แซลมอน', unit: '100 g', kcal: 208, p: 20, c: 0, f: 13 },
  { id: 'p09', cat: 'protein', name: 'เต้าหู้ขาว', unit: '100 g', kcal: 76, p: 8, c: 2, f: 4.8 },
  { id: 'p10', cat: 'protein', name: 'เวย์โปรตีน', unit: '1 สกู๊ป', kcal: 120, p: 24, c: 3, f: 1.5 },
  { id: 'p11', cat: 'protein', name: 'กรีกโยเกิร์ต (ไม่หวาน)', unit: '150 g', kcal: 110, p: 15, c: 6, f: 3 },
  { id: 'p12', cat: 'protein', name: 'นมจืด', unit: '1 กล่อง 200 ml', kcal: 130, p: 6.5, c: 9.5, f: 7 },
  { id: 'p13', cat: 'protein', name: 'นมถั่วเหลือง', unit: '1 กล่อง 250 ml', kcal: 135, p: 7, c: 15, f: 5 },
  // แป้ง / ผลไม้
  { id: 'c01', cat: 'carb', name: 'ข้าวสวย', unit: '1 ทัพพี', kcal: 130, p: 2.7, c: 28, f: 0.3 },
  { id: 'c02', cat: 'carb', name: 'ข้าวกล้อง', unit: '1 ทัพพี', kcal: 110, p: 2.6, c: 23, f: 0.9 },
  { id: 'c03', cat: 'carb', name: 'ข้าวเหนียว', unit: '1 ห่อเล็ก', kcal: 140, p: 3, c: 31, f: 0.3 },
  { id: 'c04', cat: 'carb', name: 'ข้าวโอ๊ต', unit: '40 g', kcal: 150, p: 5, c: 27, f: 2.5 },
  { id: 'c05', cat: 'carb', name: 'ขนมปังโฮลวีต', unit: '1 แผ่น', kcal: 80, p: 4, c: 14, f: 1 },
  { id: 'c06', cat: 'carb', name: 'มันหวานนึ่ง', unit: '100 g', kcal: 86, p: 1.6, c: 20, f: 0.1 },
  { id: 'c07', cat: 'carb', name: 'กล้วยหอม', unit: '1 ลูก', kcal: 105, p: 1.3, c: 27, f: 0.4 },
  { id: 'c08', cat: 'carb', name: 'แอปเปิ้ล', unit: '1 ลูก', kcal: 95, p: 0.5, c: 25, f: 0.3 },
  { id: 'c09', cat: 'carb', name: 'ส้ม', unit: '1 ลูก', kcal: 62, p: 1.2, c: 15, f: 0.2 },
  { id: 'c10', cat: 'carb', name: 'อะโวคาโด', unit: 'ครึ่งลูก', kcal: 120, p: 1.5, c: 6, f: 11 },
  { id: 'c11', cat: 'carb', name: 'อัลมอนด์', unit: '1 กำมือ 28 g', kcal: 165, p: 6, c: 6, f: 14 },
  // เครื่องดื่ม / ขนม
  { id: 'd01', cat: 'drink', name: 'อเมริกาโน่ (ไม่หวาน)', unit: '1 แก้ว', kcal: 5, p: 0, c: 1, f: 0 },
  { id: 'd02', cat: 'drink', name: 'กาแฟเย็น', unit: '1 แก้ว', kcal: 250, p: 4, c: 38, f: 9 },
  { id: 'd03', cat: 'drink', name: 'ชาไทยเย็น', unit: '1 แก้ว', kcal: 300, p: 3, c: 50, f: 10 },
  { id: 'd04', cat: 'drink', name: 'ชานมไข่มุก', unit: '1 แก้ว', kcal: 450, p: 4, c: 80, f: 12 },
  { id: 'd05', cat: 'drink', name: 'น้ำอัดลม', unit: '1 กระป๋อง', kcal: 140, p: 0, c: 39, f: 0 },
  { id: 'd06', cat: 'drink', name: 'มันฝรั่งทอด', unit: '1 ซองเล็ก 30 g', kcal: 160, p: 2, c: 15, f: 10 },
  { id: 'd07', cat: 'drink', name: 'ช็อกโกแลตแท่ง', unit: '1 แท่ง', kcal: 230, p: 3, c: 28, f: 12 },
];

// type: 'reps' = จำนวนครั้ง, 'time' = วินาที
// mode: 'sets' = ทำท่าเดิมครบทุกเซตก่อนเปลี่ยนท่า, 'circuit' = วนทุกท่าเป็นรอบ
export const PROGRAMS = [
  {
    id: 'bear', emoji: '🐻', name: 'หมีแข็งแรง', en: 'Bear Full Body', tag: 'muscle', level: 1,
    color: 'bark', mode: 'sets', sets: 3, rest: 45, met: 5,
    desc: 'ฟูลบอดี้เวทน้ำหนักตัว เหมาะสำหรับมือใหม่ ไม่ต้องใช้อุปกรณ์',
    exercises: [
      { name: 'Squat', th: 'สควอท', emoji: '🦵', type: 'reps', amount: 15, tip: 'ยืนกว้างเท่าไหล่ ย่อสะโพกไปด้านหลัง เข่าไม่เลยปลายเท้า' },
      { name: 'Push-up', th: 'วิดพื้น', emoji: '💪', type: 'reps', amount: 10, tip: 'ลำตัวตรงเป็นแนวเดียว มือใหม่วางเข่าที่พื้นได้' },
      { name: 'Bear crawl', th: 'คลานแบบหมี', emoji: '🐻', type: 'time', amount: 30, tip: 'เข่าลอยจากพื้นเล็กน้อย คลานไปข้างหน้า-ถอยหลังช้าๆ' },
      { name: 'Glute bridge', th: 'ยกสะโพก', emoji: '🍑', type: 'reps', amount: 15, tip: 'นอนหงาย ชันเข่า ดันสะโพกขึ้นแล้วบีบก้นค้างไว้ 1 วินาที' },
      { name: 'Lunge', th: 'ลันจ์', emoji: '🚶', type: 'reps', amount: 12, tip: 'ก้าวยาว ย่อจนเข่าหลังเกือบแตะพื้น สลับขา' },
      { name: 'Plank', th: 'แพลงก์', emoji: '🪵', type: 'time', amount: 30, tip: 'เกร็งท้อง สะโพกไม่ตก ไม่โด่ง' },
    ],
  },
  {
    id: 'bunny', emoji: '🐰', name: 'กระต่ายกระโดด', en: 'Bunny HIIT', tag: 'burn', level: 2,
    color: 'berry', mode: 'circuit', sets: 4, rest: 20, met: 8,
    desc: 'คาร์ดิโอแบบ HIIT สั้นแต่เหนื่อย เผาผลาญสูง',
    exercises: [
      { name: 'Jumping jack', th: 'กระโดดตบ', emoji: '⭐', type: 'time', amount: 40, tip: 'กระโดดกางขา-ยกแขนพร้อมกัน ลงด้วยปลายเท้า' },
      { name: 'Bunny hop', th: 'กระโดดกระต่าย', emoji: '🐰', type: 'time', amount: 30, tip: 'เท้าชิด กระโดดไปหน้า-หลังเบาๆ ต่อเนื่อง' },
      { name: 'High knees', th: 'ยกเข่าสูง', emoji: '🏃', type: 'time', amount: 30, tip: 'วิ่งอยู่กับที่ ยกเข่าสูงระดับสะโพก' },
      { name: 'Burpee', th: 'เบอร์พี', emoji: '🔥', type: 'reps', amount: 10, tip: 'ย่อ-ดีดขาไปหลัง-ดึงกลับ-กระโดด ทำเป็นจังหวะ' },
      { name: 'Mountain climber', th: 'ปีนเขา', emoji: '⛰️', type: 'time', amount: 30, tip: 'ท่าแพลงก์แขนตรง สลับดึงเข่าเข้าหาอกเร็วๆ' },
    ],
  },
  {
    id: 'cat', emoji: '🐱', name: 'แมวยืดเส้น', en: 'Cat Stretch', tag: 'stretch', level: 1,
    color: 'sky', mode: 'circuit', sets: 2, rest: 10, met: 2.5,
    desc: 'ยืดเหยียดคลายกล้ามเนื้อ เหมาะทำตอนเช้าหรือหลังออกกำลัง',
    exercises: [
      { name: 'Cat-cow', th: 'แมว-วัว', emoji: '🐱', type: 'time', amount: 45, tip: 'คุกเข่าสี่ขา สลับโก่งหลัง-แอ่นหลังตามลมหายใจ' },
      { name: 'Downward dog', th: 'สุนัขก้มหน้า', emoji: '🐶', type: 'time', amount: 30, tip: 'ดันสะโพกขึ้นเป็นรูปตัว V ส้นเท้ากดลงพื้น' },
      { name: 'Cobra', th: 'งูเห่า', emoji: '🐍', type: 'time', amount: 30, tip: 'นอนคว่ำ ดันอกขึ้น ไหล่ห่างหู' },
      { name: "Child's pose", th: 'ท่าเด็ก', emoji: '🧸', type: 'time', amount: 45, tip: 'นั่งบนส้นเท้า ก้มตัวไปหน้า ยืดแขนยาว' },
      { name: 'Pigeon stretch', th: 'นกพิราบ', emoji: '🕊️', type: 'time', amount: 40, tip: 'งอขาหน้า ยืดขาหลัง เปิดสะโพก สลับข้างครึ่งเวลา' },
      { name: 'Forward fold', th: 'ก้มแตะเท้า', emoji: '🙇', type: 'time', amount: 30, tip: 'นั่งเหยียดขา ก้มตัวไปหน้าโดยหลังไม่งอมาก' },
    ],
  },
  {
    id: 'kangaroo', emoji: '🦘', name: 'จิงโจ้ขาแกร่ง', en: 'Kangaroo Legs', tag: 'muscle', level: 3,
    color: 'fox', mode: 'sets', sets: 4, rest: 45, met: 6,
    desc: 'เน้นขาและก้นแบบเข้มข้น เพิ่มพลังระเบิด',
    exercises: [
      { name: 'Jump squat', th: 'สควอทกระโดด', emoji: '🦘', type: 'reps', amount: 12, tip: 'ย่อสควอทแล้วระเบิดกระโดดขึ้น ลงนุ่มๆ' },
      { name: 'Bulgarian split squat', th: 'สควอทขาเดียว', emoji: '🪑', type: 'reps', amount: 10, tip: 'วางเท้าหลังบนเก้าอี้ ย่อขาหน้า ทำข้างละ 10' },
      { name: 'Wall sit', th: 'นั่งพิงกำแพง', emoji: '🧱', type: 'time', amount: 45, tip: 'หลังพิงกำแพง เข่างอ 90 องศา ค้างไว้' },
      { name: 'Frog jump', th: 'กบกระโดด', emoji: '🐸', type: 'reps', amount: 10, tip: 'ย่อต่ำ มือแตะพื้น กระโดดไปข้างหน้า' },
      { name: 'Side lunge', th: 'ลันจ์ด้านข้าง', emoji: '↔️', type: 'reps', amount: 12, tip: 'ก้าวออกด้านข้าง ย่อขาข้างที่ก้าว อีกขาเหยียดตรง' },
      { name: 'Calf raise', th: 'เขย่งปลายเท้า', emoji: '🦶', type: 'reps', amount: 20, tip: 'เขย่งขึ้นสุด ค้าง 1 วินาที ลงช้าๆ' },
    ],
  },
  {
    id: 'gorilla', emoji: '🦍', name: 'กอริลลาช่วงบน', en: 'Gorilla Upper', tag: 'muscle', level: 2,
    color: 'leaf', mode: 'sets', sets: 3, rest: 45, met: 5,
    desc: 'อก ไหล่ แขน หลัง ด้วยน้ำหนักตัว',
    exercises: [
      { name: 'Push-up', th: 'วิดพื้น', emoji: '💪', type: 'reps', amount: 12, tip: 'ลงช้า 2 วินาที ดันขึ้นเร็ว' },
      { name: 'Pike push-up', th: 'วิดพื้นไหล่', emoji: '🔺', type: 'reps', amount: 8, tip: 'ยกสะโพกสูงเป็นตัว V งอศอกให้ศีรษะเข้าใกล้พื้น' },
      { name: 'Chair dip', th: 'ดิปเก้าอี้', emoji: '🪑', type: 'reps', amount: 12, tip: 'มือจับขอบเก้าอี้ด้านหลัง งอศอกลง-ดันขึ้น' },
      { name: 'Superman', th: 'ซูเปอร์แมน', emoji: '🦸', type: 'reps', amount: 12, tip: 'นอนคว่ำ ยกแขนและขาพร้อมกัน ค้าง 2 วินาที' },
      { name: 'Shoulder tap', th: 'แตะไหล่', emoji: '🤚', type: 'reps', amount: 20, tip: 'ท่าแพลงก์แขนตรง สลับแตะไหล่ สะโพกนิ่ง' },
      { name: 'Diamond push-up', th: 'วิดพื้นมือเพชร', emoji: '💎', type: 'reps', amount: 8, tip: 'มือชิดกันเป็นรูปเพชรใต้หน้าอก เน้นหลังแขน' },
    ],
  },
  {
    id: 'frog', emoji: '🐸', name: 'กบแกนกลาง', en: 'Frog Core', tag: 'muscle', level: 2,
    color: 'leaf', mode: 'circuit', sets: 3, rest: 30, met: 4,
    desc: 'หน้าท้อง เอว และแกนกลางลำตัวให้แข็งแรง',
    exercises: [
      { name: 'Crunch', th: 'ครันช์', emoji: '🌀', type: 'reps', amount: 20, tip: 'ยกไหล่พ้นพื้น ไม่ดึงคอ' },
      { name: 'Leg raise', th: 'ยกขา', emoji: '🦵', type: 'reps', amount: 12, tip: 'นอนหงาย ยกขาตรงขึ้น-ลงช้าๆ หลังล่างแนบพื้น' },
      { name: 'Russian twist', th: 'บิดลำตัว', emoji: '🔄', type: 'reps', amount: 20, tip: 'นั่งเอนหลัง ยกเท้า บิดตัวซ้าย-ขวา' },
      { name: 'Bicycle crunch', th: 'ปั่นจักรยาน', emoji: '🚲', type: 'reps', amount: 20, tip: 'ศอกแตะเข่าฝั่งตรงข้าม สลับไปมา' },
      { name: 'Dead bug', th: 'แมลงหงาย', emoji: '🐞', type: 'reps', amount: 12, tip: 'นอนหงาย ยืดแขน-ขาฝั่งตรงข้ามออกช้าๆ' },
      { name: 'Plank', th: 'แพลงก์', emoji: '🪵', type: 'time', amount: 40, tip: 'เกร็งท้อง หายใจสม่ำเสมอ' },
    ],
  },
  {
    id: 'crab', emoji: '🦀', name: 'ปูคาร์ดิโอเบาๆ', en: 'Crab Low-Impact', tag: 'burn', level: 1,
    color: 'sun', mode: 'circuit', sets: 3, rest: 20, met: 4,
    desc: 'คาร์ดิโอแรงกระแทกต่ำ ไม่กระโดด เป็นมิตรกับเข่า',
    exercises: [
      { name: 'March in place', th: 'ย่ำเท้าอยู่กับที่', emoji: '🥁', type: 'time', amount: 60, tip: 'ยกเข่าสลับ แกว่งแขนเป็นจังหวะ' },
      { name: 'Crab walk', th: 'เดินปู', emoji: '🦀', type: 'time', amount: 30, tip: 'นั่ง มือวางด้านหลัง ยกสะโพก เดินไปข้างหน้า-หลัง' },
      { name: 'Step jack', th: 'ก้าวตบ', emoji: '👐', type: 'time', amount: 40, tip: 'ก้าวขาออกข้างพร้อมยกแขน สลับซ้าย-ขวา' },
      { name: 'Side shuffle', th: 'สไลด์ด้านข้าง', emoji: '↔️', type: 'time', amount: 40, tip: 'ย่อเข่าเล็กน้อย สไลด์เท้าไปซ้าย-ขวา' },
      { name: 'Arm circles', th: 'หมุนแขน', emoji: '🌪️', type: 'time', amount: 30, tip: 'กางแขน หมุนวงเล็กไปหน้าและหลัง' },
    ],
  },
];

export const PROGRAM_TAGS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'burn', label: 'เผาไขมัน' },
  { id: 'muscle', label: 'สร้างกล้าม' },
  { id: 'stretch', label: 'ยืดเหยียด' },
];

export const LEVEL_LABELS = { 1: 'ง่าย', 2: 'กลาง', 3: 'ยาก' };

// กิจกรรมทั่วไปที่บันทึกเองได้ (ค่า MET จาก Compendium of Physical Activities โดยประมาณ)
export const QUICK_ACTIVITIES = [
  { id: 'walk', emoji: '🐧', label: 'เดินเร็ว', met: 4.3 },
  { id: 'run', emoji: '🐆', label: 'วิ่ง (8 กม./ชม.)', met: 8.3 },
  { id: 'cycle', emoji: '🐒', label: 'ปั่นจักรยาน', met: 7.5 },
  { id: 'swim', emoji: '🐬', label: 'ว่ายน้ำ', met: 6 },
  { id: 'gym', emoji: '🦬', label: 'เวทเทรนนิ่ง', met: 5 },
  { id: 'yoga', emoji: '🦩', label: 'โยคะ', met: 2.5 },
  { id: 'dance', emoji: '🦜', label: 'เต้น/แอโรบิก', met: 6.5 },
  { id: 'sport', emoji: '🐐', label: 'แบดมินตัน/ฟุตบอล', met: 7 },
];
