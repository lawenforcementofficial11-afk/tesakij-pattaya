/**
 * แจ้งเหตุบนถนน (Waze-style) — เก็บใน data/alerts.json, ส่งแบบเรียลไทม์ผ่าน Server-Sent Events
 * สาธารณะ: GET /api/alerts, GET /api/alerts/stream (SSE), POST /api/alerts, POST /api/alerts/:id/vote
 * ผู้ดูแล: GET/POST /api/admin/alerts, PATCH/DELETE /api/admin/alerts/:id, POST /api/admin/alerts/demo, DELETE /api/admin/alerts?examples=1
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

module.exports = function mountAlerts(app, { ROOT, DATA, readJson, writeJson, requireAdmin, rateLimit, clean, CONTENT_FILE, SESSION_SECRET }) {
  const FILE = path.join(DATA, 'alerts.json');
  const PHOTO_DIR = path.join(ROOT, 'uploads', 'alerts');
  fs.mkdirSync(PHOTO_DIR, { recursive: true });
  let alerts = [];
  try { alerts = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { alerts = []; }
  const save = () => writeJson(FILE, alerts);
  const cfg = async () => (await readJson(CONTENT_FILE, {})).alerts || {};
  const typeOf = (c, k) => (c.types || []).find(t => t.key === k);
  const hashIp = ip => crypto.createHmac('sha256', SESSION_SECRET).update(String(ip)).digest('hex').slice(0, 16);
  const now = () => Date.now();
  const isActive = a => !a.removed && new Date(a.expiresAt).getTime() > now();
  const pub = a => ({ id: a.id, type: a.type, lat: a.lat, lng: a.lng, note: a.note, photo: a.photo, createdAt: a.createdAt, expiresAt: a.expiresAt, up: a.up, down: a.down, official: !!a.official, pinned: !!a.pinned, isExample: !!a.isExample });
  const newId = () => 'A' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');

  // ---------- SSE ----------
  const clients = new Set();
  function broadcast(event, data) { const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`; for (const res of clients) res.write(msg); }
  setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 25000).unref();
  // expire sweep
  const announced = new Set(alerts.filter(isActive).map(a => a.id));
  setInterval(() => {
    for (const a of alerts) if (announced.has(a.id) && !isActive(a)) { announced.delete(a.id); broadcast('remove', { id: a.id }); }
    // purge records expired > 30 days
    const cutoff = now() - 30 * 864e5, before = alerts.length;
    alerts = alerts.filter(a => new Date(a.expiresAt).getTime() > cutoff || a.pinned);
    if (alerts.length !== before) save();
  }, 30000).unref();
  function upsert(a) { if (isActive(a)) { announced.add(a.id); broadcast('upsert', pub(a)); } else if (announced.has(a.id)) { announced.delete(a.id); broadcast('remove', { id: a.id }); } }

  app.get('/api/alerts', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.json(alerts.filter(isActive).map(pub).sort((x, y) => (y.pinned - x.pinned) || (new Date(y.createdAt) - new Date(x.createdAt))));
  });
  app.get('/api/alerts/stream', (req, res) => {
    if (clients.size > 1000) return res.status(503).end();
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders(); res.write('retry: 5000\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
  });

  // ---------- public report ----------
  const upload = multer({
    storage: multer.diskStorage({ destination: PHOTO_DIR, filename: (r, f, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${(path.extname(f.originalname || '').toLowerCase().match(/^\.(png|jpe?g|webp)$/) || ['.jpg'])[0]}`) }),
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 10 },
    fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpe?g|webp)$/.test(file.mimetype))
  });
  app.post('/api/alerts', rateLimit(5, 10 * 60 * 1000), upload.single('photo'), async (req, res) => {
    const c = await cfg(), b = req.body || {};
    const drop = () => { if (req.file) fs.unlink(req.file.path, () => {}); };
    if (c.enabled === false) { drop(); return res.status(503).json({ error: 'ปิดรับแจ้งเหตุชั่วคราว' }); }
    if (b.website) { drop(); return res.status(201).json({ ok: true }); } // honeypot: แกล้งตอบสำเร็จ
    if (Number(b.t) && now() - Number(b.t) < 2500) { drop(); return res.status(429).json({ error: 'ส่งเร็วเกินไป กรุณาลองใหม่' }); }
    const t = typeOf(c, b.type);
    const lat = Number(b.lat), lng = Number(b.lng), bd = c.bounds || {};
    if (!t) { drop(); return res.status(400).json({ error: 'กรุณาเลือกประเภทเหตุ' }); }
    if (!isFinite(lat) || !isFinite(lng) || (bd.south != null && (lat < bd.south || lat > bd.north || lng < bd.west || lng > bd.east))) { drop(); return res.status(400).json({ error: 'ตำแหน่งอยู่นอกพื้นที่เมืองพัทยา' }); }
    if (req.file && req.file.size > (c.maxPhotoMB || 5) * 1024 * 1024) { drop(); return res.status(413).json({ error: `รูปต้องไม่เกิน ${c.maxPhotoMB || 5} MB` }); }
    const ttl = (t.ttlHours || 3) * 3600e3;
    const a = { id: newId(), type: t.key, lat: +lat.toFixed(6), lng: +lng.toFixed(6), note: clean(b.note, c.maxNoteLength || 140), photo: req.file ? 'uploads/alerts/' + req.file.filename : null,
      createdAt: new Date().toISOString(), expiresAt: new Date(now() + ttl).toISOString(), up: 0, down: 0, official: false, pinned: false, isExample: false, reporter: hashIp(req.ip), voters: [] };
    alerts.push(a); await save(); upsert(a);
    res.status(201).json(pub(a));
  });
  app.post('/api/alerts/:id/vote', rateLimit(30, 10 * 60 * 1000), async (req, res) => {
    const a = alerts.find(x => x.id === req.params.id);
    if (!a || !isActive(a)) return res.status(404).json({ error: 'เหตุนี้หมดอายุแล้ว' });
    const v = req.body && req.body.vote, h = hashIp(req.ip);
    if (v !== 'up' && v !== 'down') return res.status(400).json({ error: 'bad vote' });
    a.voters = a.voters || [];
    if (a.voters.includes(h)) return res.status(409).json({ error: 'คุณยืนยันเหตุนี้ไปแล้ว', alert: pub(a) });
    a.voters.push(h);
    const c = await cfg(), t = typeOf(c, a.type) || { ttlHours: 3 };
    if (v === 'up') {
      a.up++;
      const ext = now() + (t.ttlHours * 3600e3) * (c.voteExtendRatio ?? 0.5);
      if (!a.official && ext > new Date(a.expiresAt).getTime()) a.expiresAt = new Date(ext).toISOString();
    } else {
      a.down++;
      if (!a.official && !a.pinned && a.down >= (c.downvotesToRemove || 3) && a.down > a.up) a.expiresAt = new Date().toISOString();
    }
    await save(); upsert(a);
    res.json(pub(a));
  });

  // ---------- admin ----------
  app.get('/api/admin/alerts', requireAdmin, (req, res) => {
    res.json(alerts.slice().sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt)).slice(0, 500).map(a => ({ ...pub(a), active: isActive(a), reporter: a.reporter || null, removed: !!a.removed })));
  });
  function applyFields(a, b, c) {
    if (b.type !== undefined) { if (!typeOf(c, b.type)) throw new Error('ประเภทไม่ถูกต้อง'); a.type = b.type; }
    if (b.lat !== undefined) a.lat = Number(b.lat);
    if (b.lng !== undefined) a.lng = Number(b.lng);
    if (b.note !== undefined) a.note = clean(b.note, 500);
    if (b.photo !== undefined) a.photo = b.photo ? clean(b.photo, 300) : null;
    if (b.official !== undefined) a.official = !!b.official;
    if (b.pinned !== undefined) a.pinned = !!b.pinned;
    if (b.isExample !== undefined) a.isExample = !!b.isExample;
    if (b.hours !== undefined && Number(b.hours) > 0) a.expiresAt = new Date(now() + Number(b.hours) * 3600e3).toISOString();
    if (b.expiresAt) { const d = new Date(b.expiresAt); if (!isNaN(d)) a.expiresAt = d.toISOString(); }
    if (b.removed !== undefined) a.removed = !!b.removed;
    if (!isFinite(a.lat) || !isFinite(a.lng)) throw new Error('พิกัดไม่ถูกต้อง');
  }
  app.post('/api/admin/alerts', requireAdmin, async (req, res) => {
    const c = await cfg(), b = req.body || {}, t = typeOf(c, b.type) || (c.types || [])[0];
    const a = { id: newId(), type: t.key, lat: 0, lng: 0, note: '', photo: null, createdAt: new Date().toISOString(), expiresAt: new Date(now() + (t.ttlHours || 3) * 3600e3).toISOString(), up: 0, down: 0, official: true, pinned: false, isExample: false, reporter: 'admin', voters: [] };
    try { applyFields(a, b, c); } catch (e) { return res.status(400).json({ error: e.message }); }
    alerts.push(a); await save(); upsert(a); res.status(201).json(pub(a));
  });
  app.patch('/api/admin/alerts/:id', requireAdmin, async (req, res) => {
    const a = alerts.find(x => x.id === req.params.id); if (!a) return res.status(404).json({ error: 'not found' });
    try { applyFields(a, req.body || {}, await cfg()); } catch (e) { return res.status(400).json({ error: e.message }); }
    await save(); upsert(a); res.json(pub(a));
  });
  function removeAlert(a) {
    if (a.photo && a.photo.startsWith('uploads/alerts/')) fs.unlink(path.join(PHOTO_DIR, path.basename(a.photo)), () => {});
    if (announced.has(a.id)) { announced.delete(a.id); broadcast('remove', { id: a.id }); }
  }
  app.delete('/api/admin/alerts/:id', requireAdmin, async (req, res) => {
    const i = alerts.findIndex(x => x.id === req.params.id); if (i < 0) return res.status(404).json({ error: 'not found' });
    removeAlert(alerts[i]); alerts.splice(i, 1); await save(); res.json({ ok: true });
  });
  app.delete('/api/admin/alerts', requireAdmin, async (req, res) => {
    if (req.query.examples !== '1') return res.status(400).json({ error: 'ระบุ ?examples=1' });
    const ex = alerts.filter(a => a.isExample); ex.forEach(removeAlert);
    alerts = alerts.filter(a => !a.isExample); await save(); res.json({ removed: ex.length });
  });
  // ตัวอย่างสำหรับสาธิต — ติดป้าย “ตัวอย่าง” ทุกรายการ และลบได้ทั้งหมดด้วยปุ่มเดียว
  async function seedDemo() {
    const c = await cfg();
    const demo = [
      ['construction', 12.9352, 100.8858, 'ตัวอย่าง: ซ่อมผิวถนนพัทยาสาย 2 ปิด 1 ช่องจราจร', true, 72, 0],
      ['accident', 12.9301, 100.8781, 'ตัวอย่าง: รถจักรยานยนต์เฉี่ยวชน ช่องซ้ายติดขัด', false, 1.5, 14],
      ['flood', 12.9378, 100.8925, 'ตัวอย่าง: น้ำท่วมขังหลังฝนตก ประมาณ 20 ซม.', false, 4, 35],
      ['jam', 12.9366, 100.8985, 'ตัวอย่าง: รถติดสะสมแยกพัทยากลาง', false, 1, 6],
      ['hazard', 12.8985, 100.8690, 'ตัวอย่าง: กิ่งไม้ล้มขวางช่องทางเดินรถ', false, 3, 50]
    ];
    const made = demo.map(([type, lat, lng, note, official, hours, agoMin]) => {
      const t = typeOf(c, type) || { key: type };
      const a = { id: newId(), type: t.key, lat, lng, note, photo: null, createdAt: new Date(now() - agoMin * 60e3).toISOString(), expiresAt: new Date(now() + hours * 3600e3).toISOString(), up: Math.floor(Math.random() * 5), down: 0, official, pinned: false, isExample: true, reporter: 'demo', voters: [] };
      alerts.push(a); upsert(a); return pub(a);
    });
    await save(); return made;
  }
  // ตัวอย่างสำหรับสาธิต — ติดป้าย “ตัวอย่าง” ทุกรายการ และลบได้ทั้งหมดด้วยปุ่มเดียว
  app.post('/api/admin/alerts/demo', requireAdmin, async (req, res) => { res.status(201).json(await seedDemo()); });
  // โหมดเดโม (SEED_DEMO_ALERTS=1): ใส่ตัวอย่างอัตโนมัติเมื่อไม่มีการแจ้งเหตุที่ยังแสดงอยู่ (ตอนเริ่มเซิร์ฟเวอร์ และตรวจทุก 30 นาที)
  if (process.env.SEED_DEMO_ALERTS === '1') {
    const ensure = () => { if (!alerts.some(isActive)) seedDemo().catch(e => console.warn('[alerts] seed failed', e.message)); };
    setTimeout(ensure, 500); setInterval(ensure, 30 * 60 * 1000).unref();
  }
};
