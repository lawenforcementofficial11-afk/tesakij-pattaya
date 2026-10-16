/**
 * เทศกิจพัทยา — เซิร์ฟเวอร์เว็บ + API หลังบ้าน (ผู้ดูแลคนเดียว)
 * - เนื้อหาทั้งหมดเก็บใน data/content.json (แก้ผ่าน /admin)
 * - เรื่องร้องเรียนเก็บใน data/submissions.json (ไม่เปิดสาธารณะ)
 * - รูปที่ผู้ดูแลอัปโหลดอยู่ใน uploads/ (สาธารณะ), รูปจากผู้ร้องเรียนอยู่ใน data/complaint-photos/ (เฉพาะผู้ดูแล)
 */
'use strict';
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const chatbot = require('./chatbot');
const tts = require('./tts');
const mountAlerts = require('./alerts');

// ---- load .env (no extra dependency) ----
(function loadEnv() {
  const f = path.join(__dirname, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
})();

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const CONTENT_FILE = path.join(DATA, 'content.json');
const SUBMISSIONS_FILE = path.join(DATA, 'submissions.json');
const BACKUP_DIR = path.join(DATA, 'backups');
const COMPLAINT_PHOTOS = path.join(DATA, 'complaint-photos');
const UPLOADS = path.join(ROOT, 'uploads');
for (const d of [DATA, BACKUP_DIR, COMPLAINT_PHOTOS, UPLOADS]) fs.mkdirSync(d, { recursive: true });

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const COOKIE_SECURE = process.env.COOKIE_SECURE === '1';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 ชั่วโมง

let ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || null;
if (!ADMIN_HASH && process.env.ADMIN_PASSWORD) ADMIN_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
if (!ADMIN_HASH) console.warn('[!] ยังไม่ได้ตั้ง ADMIN_PASSWORD หรือ ADMIN_PASSWORD_HASH — จะเข้าสู่ระบบ /admin ไม่ได้');
if (!process.env.SESSION_SECRET) console.warn('[!] ไม่ได้ตั้ง SESSION_SECRET — ใช้ค่าสุ่มชั่วคราว (ต้องล็อกอินใหม่เมื่อรีสตาร์ต)');

// ---- helpers ----
async function readJson(file, fallback) {
  try { return JSON.parse(await fsp.readFile(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return fallback; throw e; }
}
let writeChain = Promise.resolve();
function writeJson(file, obj) { // atomic + serialized writes
  writeChain = writeChain.then(async () => {
    const tmp = file + '.' + process.pid + '.tmp';
    await fsp.writeFile(tmp, JSON.stringify(obj, null, 2));
    await fsp.rename(tmp, file);
  });
  return writeChain;
}
function sign(v) { return crypto.createHmac('sha256', SESSION_SECRET).update(v).digest('base64url'); }
function makeToken() { const p = `admin.${Date.now() + SESSION_TTL_MS}.${crypto.randomBytes(8).toString('hex')}`; return `${p}.${sign(p)}`; }
function verifyToken(t) {
  if (!t) return false;
  const i = t.lastIndexOf('.'); if (i < 0) return false;
  const p = t.slice(0, i), s = t.slice(i + 1), exp = sign(p);
  if (s.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(exp))) return false;
  return Number(p.split('.')[1]) > Date.now();
}
function getCookie(req, name) {
  const m = (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}
function requireAdmin(req, res, next) {
  if (verifyToken(getCookie(req, 'tkp_admin'))) return next();
  res.status(401).json({ error: 'unauthorized' });
}
function rateLimit(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now(), k = req.ip;
    const arr = (hits.get(k) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง' });
    arr.push(now); hits.set(k, arr); next();
  };
}
const clean = (v, max = 2000) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const STATUS = { received: 'รับเรื่อง', in_progress: 'กำลังดำเนินการ', done: 'เสร็จสิ้น' };

const imageFilter = (req, file, cb) => cb(null, /^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype));
const safeName = (orig) => {
  const ext = (path.extname(orig || '').toLowerCase().match(/^\.(png|jpe?g|webp|gif)$/) || ['.jpg'])[0];
  return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
};
const adminUpload = multer({ storage: multer.diskStorage({ destination: UPLOADS, filename: (r, f, cb) => cb(null, safeName(f.originalname)) }), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: imageFilter });
const complaintUpload = multer({ storage: multer.diskStorage({ destination: COMPLAINT_PHOTOS, filename: (r, f, cb) => cb(null, safeName(f.originalname)) }), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpe?g|webp|heic|heif)$/.test(file.mimetype)) });

// ---- app ----
const app = express();
app.disable('x-powered-by');
// หลัง reverse proxy/โฮสต์ (Render, Railway ฯลฯ) ตั้ง TRUST_PROXY=1 (จำนวน hop) เพื่อให้ rate limit อ่าน IP ผู้ใช้ได้ถูกต้อง
const TP = process.env.TRUST_PROXY;
app.set('trust proxy', TP ? (/^\d+$/.test(TP) ? Number(TP) : TP === 'true' ? true : TP) : 'loopback');
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN' });
  next();
});
app.use(express.json({ limit: '2mb' }));

// Public content
app.get(['/api/content', '/data/content.json'], async (req, res) => {
  res.set('Cache-Control', 'no-cache');
  const c = await readJson(CONTENT_FILE, {});
  // ค่า Google Maps จาก env ใช้เมื่อยังไม่ได้ตั้งในหลังบ้าน (หลังบ้านขอข้อมูลดิบด้วย ?raw=1 เพื่อไม่ให้ค่า env ถูกบันทึกลงไฟล์)
  if (req.query.raw !== '1' && c.traffic) {
    c.traffic.googleMapsApiKey = c.traffic.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY || '';
    c.traffic.googleMapsMapId = c.traffic.googleMapsMapId || process.env.GOOGLE_MAPS_MAP_ID || '';
  }
  res.json(c);
});

// Auth
app.post('/api/login', rateLimit(8, 10 * 60 * 1000), async (req, res) => {
  const ok = ADMIN_HASH && typeof req.body?.password === 'string' && await bcrypt.compare(req.body.password, ADMIN_HASH);
  if (!ok) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
  res.cookie('tkp_admin', makeToken(), { httpOnly: true, sameSite: 'strict', secure: COOKIE_SECURE, maxAge: SESSION_TTL_MS, path: '/' });
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { res.clearCookie('tkp_admin', { path: '/' }); res.json({ ok: true }); });
app.get('/api/me', (req, res) => res.json({ admin: verifyToken(getCookie(req, 'tkp_admin')) }));

// Admin: content
app.put('/api/content', requireAdmin, async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' });
  const prev = await readJson(CONTENT_FILE, null);
  if (prev) {
    await fsp.writeFile(path.join(BACKUP_DIR, `content-${new Date().toISOString().replace(/[:.]/g, '-')}.json`), JSON.stringify(prev, null, 2));
    const files = (await fsp.readdir(BACKUP_DIR)).filter(f => f.startsWith('content-')).sort();
    for (const f of files.slice(0, Math.max(0, files.length - 30))) await fsp.unlink(path.join(BACKUP_DIR, f));
  }
  await writeJson(CONTENT_FILE, body);
  res.json({ ok: true, savedAt: new Date().toISOString() });
});
app.post('/api/upload', requireAdmin, adminUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'รองรับเฉพาะไฟล์รูปภาพ (ไม่เกิน 8 MB)' });
  res.json({ url: 'uploads/' + req.file.filename });
});

// Public: complaints + tracking
app.post('/api/complaints', rateLimit(10, 60 * 60 * 1000), complaintUpload.single('photo'), async (req, res) => {
  const b = req.body || {};
  const c = { name: clean(b.name, 120) || 'ไม่ระบุชื่อ', phone: clean(b.phone, 40), category: clean(b.category, 120), description: clean(b.description, 4000), location: clean(b.location, 300) };
  if (!c.phone || !c.category || !c.description) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
  }
  const list = await readJson(SUBMISSIONS_FILE, []);
  let id;
  do { id = `TKP-${new Date().getFullYear() + 543}-${String(crypto.randomInt(0, 100000)).padStart(5, '0')}`; } while (list.some(x => x.id === id));
  const now = new Date().toISOString();
  list.unshift({ id, ...c, photo: req.file ? req.file.filename : null, status: 'received', createdAt: now, history: [{ status: 'received', at: now, note: 'ระบบรับเรื่องเรียบร้อย' }] });
  await writeJson(SUBMISSIONS_FILE, list);
  res.status(201).json({ id });
});
app.get('/api/track/:id', rateLimit(60, 60 * 1000), async (req, res) => {
  const id = clean(req.params.id, 40).toUpperCase();
  const item = (await readJson(SUBMISSIONS_FILE, [])).find(x => x.id === id);
  if (!item) return res.status(404).json({ error: 'ไม่พบเลขรับเรื่องนี้' });
  // ส่งเฉพาะข้อมูลที่ไม่ระบุตัวตน
  res.json({ id: item.id, category: item.category, status: item.status, statusLabel: STATUS[item.status], createdAt: item.createdAt, history: item.history.map(h => ({ status: h.status, label: STATUS[h.status], at: h.at, note: h.note })) });
});

// Public: chatbot (offline KB หรือ LLM ถ้าตั้ง AI_API_KEY)
app.post('/api/chat', rateLimit(20, 60 * 1000), async (req, res) => {
  const message = clean(req.body?.message, 1000);
  if (!message) return res.status(400).json({ error: 'empty message' });
  const content = await readJson(CONTENT_FILE, {});
  if ((content.chatbot && content.chatbot.enabled === false) || (content.features && content.features.chatbot === false)) return res.status(503).json({ error: 'chatbot disabled' });
  res.json(await chatbot.answer(message, req.body?.history, content, req.body?.lang));
});
// Public: เสียงพูดของบอท (server TTS ถ้าตั้งค่า มิฉะนั้นหน้าเว็บใช้เสียงในเบราว์เซอร์)
app.get('/api/tts/status', (req, res) => res.json({ enabled: !!tts.provider() }));
app.post('/api/tts', rateLimit(30, 60 * 1000), async (req, res) => {
  if (!tts.provider()) return res.status(503).json({ error: 'tts not configured' });
  const content = await readJson(CONTENT_FILE, {});
  const v = (content.chatbot && content.chatbot.voice) || {};
  if (v.enabled === false || v.serverTts === false || (content.chatbot && content.chatbot.enabled === false)) return res.status(503).json({ error: 'voice disabled' });
  const text = clean(req.body?.text, 600);
  if (!text) return res.status(400).json({ error: 'empty text' });
  try {
    const audio = await tts.synth(text, req.body?.lang, req.body?.gender || v.gender, req.body?.rate || v.rate);
    res.set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=3600' }).send(audio);
  } catch (e) { console.warn('[tts]', e.message); res.status(502).json({ error: 'tts failed' }); }
});
app.get('/api/chat/system-prompt', requireAdmin, async (req, res) => res.type('text/plain').send(chatbot.buildSystemPrompt(await readJson(CONTENT_FILE, {}))));
app.get('/api/chat/mode', requireAdmin, (req, res) => res.json({ mode: process.env.AI_API_KEY ? 'llm' : 'offline', baseUrl: process.env.AI_API_KEY ? (process.env.AI_BASE_URL || 'https://api.openai.com/v1') : null, model: process.env.AI_API_KEY ? (process.env.AI_MODEL || 'gpt-4o-mini') : null }));

// Admin: complaints
app.get('/api/complaints', requireAdmin, async (req, res) => res.json(await readJson(SUBMISSIONS_FILE, [])));
app.patch('/api/complaints/:id', requireAdmin, async (req, res) => {
  const list = await readJson(SUBMISSIONS_FILE, []);
  const item = list.find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'not found' });
  const status = req.body?.status;
  if (!STATUS[status]) return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
  item.status = status;
  item.history.push({ status, at: new Date().toISOString(), note: clean(req.body.note, 500) });
  await writeJson(SUBMISSIONS_FILE, list);
  res.json(item);
});
app.delete('/api/complaints/:id', requireAdmin, async (req, res) => {
  const list = await readJson(SUBMISSIONS_FILE, []);
  const i = list.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'not found' });
  const [gone] = list.splice(i, 1);
  if (gone.photo) fs.unlink(path.join(COMPLAINT_PHOTOS, path.basename(gone.photo)), () => {});
  await writeJson(SUBMISSIONS_FILE, list);
  res.json({ ok: true });
});
app.get('/api/complaints/:id/photo', requireAdmin, async (req, res) => {
  const item = (await readJson(SUBMISSIONS_FILE, [])).find(x => x.id === req.params.id);
  if (!item?.photo) return res.status(404).end();
  res.sendFile(path.join(COMPLAINT_PHOTOS, path.basename(item.photo)));
});
app.get('/api/complaints.csv', requireAdmin, async (req, res) => {
  const list = await readJson(SUBMISSIONS_FILE, []);
  const esc = v => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const rows = [['เลขรับเรื่อง', 'วันที่แจ้ง', 'สถานะ', 'ประเภท', 'ชื่อ', 'โทรศัพท์', 'ตำแหน่ง', 'รายละเอียด', 'มีรูปภาพ']]
    .concat(list.map(x => [x.id, x.createdAt, STATUS[x.status], x.category, x.name, x.phone, x.location, x.description, x.photo ? 'มี' : '']));
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="complaints-${Date.now()}.csv"` });
  res.send('\uFEFF' + rows.map(r => r.map(esc).join(',')).join('\r\n'));
});

// Road alerts (Waze-style, realtime SSE)
mountAlerts(app, { ROOT, DATA, readJson, writeJson, requireAdmin, rateLimit, clean, CONTENT_FILE, SESSION_SECRET });

// Static files (เฉพาะโฟลเดอร์ที่เป็นสาธารณะ — ไม่เปิด data/ ทั้งโฟลเดอร์)
app.use('/assets', express.static(path.join(ROOT, 'assets'), { maxAge: '7d' }));
app.use('/uploads', express.static(UPLOADS, { maxAge: '7d' }));
app.get(['/admin', '/admin/'], (req, res) => { res.set('X-Robots-Tag', 'noindex, nofollow'); res.sendFile(path.join(ROOT, 'admin', 'index.html')); });
app.get(['/', '/index.html'], (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 500).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'ไฟล์มีขนาดใหญ่เกินไป' : 'เกิดข้อผิดพลาดภายในระบบ' }); });
app.use((req, res) => res.status(404).send('Not found'));

app.listen(PORT, () => console.log(`เทศกิจพัทยา พร้อมใช้งานที่ http://localhost:${PORT}  (หลังบ้าน: /admin)`));
