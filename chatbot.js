/**
 * น้องอัศวิน — chatbot engine (TH / EN / 中文 / РУС)
 * โหมด 1 (ค่าเริ่มต้น): ออฟไลน์ ตอบจากฐานความรู้ใน content.json เท่านั้น
 *   = chatbot.kb + faq + laws.items (ข้อมูลกฎหมายที่สรุปจากเว็บไซต์ราชการ พร้อม URL แหล่งที่มา)
 *   ถ้าไม่พบคำตอบที่มั่นใจ → ไม่เดา ตอบว่าไม่มีข้อมูล + ลิงก์ทางการ (chatbot.fallbackI18n)
 * โหมด 2: ถ้าตั้ง AI_API_KEY จะเรียก LLM แบบ OpenAI-compatible (/chat/completions) — กุญแจอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น
 *   system prompt บังคับให้ใช้เฉพาะฐานความรู้ + แนบ URL แหล่งที่มาเมื่อตอบเรื่องกฎหมาย/ค่าปรับ
 *   AI_BASE_URL  เช่น https://api.openai.com/v1 | https://api.x.ai/v1 | https://generativelanguage.googleapis.com/v1beta/openai
 *   AI_MODEL     เช่น gpt-4o-mini | grok-3-mini | gemini-2.0-flash
 */
'use strict';

const LANGS = ['th', 'en', 'zh', 'ru'];
const LANG_NAME = { th: 'ภาษาไทย (Thai)', en: 'English', zh: '简体中文 (Simplified Chinese)', ru: 'Русский (Russian)' };
const UI2LANG = { TH: 'th', EN: 'en', '中文': 'zh', 'РУС': 'ru', th: 'th', en: 'en', zh: 'zh', ru: 'ru' };

/** ภาษาของข้อความ: ตัวอักษรที่พิมพ์ชนะ ถ้าไม่ชัดเจน (ตัวเลข/อีโมจิ) ใช้ภาษาที่เลือกบนเว็บ */
function detectLang(message, uiLang) {
  const m = String(message || '');
  if (/[\u0E00-\u0E7F]/.test(m)) return 'th';
  if (/[\u3400-\u9FFF]/.test(m)) return 'zh';
  if (/[\u0400-\u04FF]/.test(m)) return 'ru';
  if (/[a-z]{2,}/i.test(m)) return 'en';
  return UI2LANG[uiLang] || 'th';
}

const norm = s => String(s || '').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, ' ').trim();
const bigrams = s => { const t = norm(s).replace(/ /g, ''); const out = new Set(); for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2)); return out; };
function dice(a, b) { const A = bigrams(a), B = bigrams(b); if (!A.size || !B.size) return 0; let n = 0; for (const x of A) if (B.has(x)) n++; return (2 * n) / (A.size + B.size); }

function fill(tpl, c) {
  const s = c.site || {};
  return String(tpl || '')
    .replace(/\{hotline\}/g, s.hotline || '-').replace(/\{hours\}/g, s.hours || '-').replace(/\{address\}/g, s.address || '-')
    .replace(/\{email\}/g, s.email || '-').replace(/\{lineId\}/g, s.lineId || '-').replace(/\{siteName\}/g, s.name || '')
    .replace(/\{laws\}/g, lawsSummary(c));
}
function lawsSummary(c) {
  return ((c.laws && c.laws.items) || []).map(l => `• ${l.title}: ${l.fine}${l.url ? ' — ' + l.url : ''}`).join('\n');
}

// ชื่อกฎหมายภาษาอื่น (สำหรับอ้างอิงในคำตอบ) — ข้อความทางการยังเป็นภาษาไทยในแหล่งอ้างอิง
const REF_TR = {
  en: [[/พ\.ร\.บ\.รักษาความสะอาดและความเป็นระเบียบเรียบร้อยของบ้านเมือง พ\.ศ\. 2535/g, 'Maintenance of Cleanliness and Orderliness of the Country Act B.E. 2535 (1992)'], [/พ\.ร\.บ\.การสาธารณสุข พ\.ศ\. 2535/g, 'Public Health Act B.E. 2535 (1992)'], [/ข้อบัญญัติเมืองพัทยา/g, 'Pattaya City Ordinance'], [/ม\./g, 's.'], [/บทลงโทษ/g, 'penalty'], [/วรรคหนึ่ง/g, 'para. 1'], [/วรรคสอง/g, 'para. 2'], [/วรรคสาม/g, 'para. 3'], [/ข้อ /g, 'cl. ']],
  zh: [[/พ\.ร\.บ\.รักษาความสะอาดและความเป็นระเบียบเรียบร้อยของบ้านเมือง พ\.ศ\. 2535/g, '《维护国家清洁与秩序法》佛历2535年（1992）'], [/พ\.ร\.บ\.การสาธารณสุข พ\.ศ\. 2535/g, '《公共卫生法》佛历2535年（1992）'], [/ข้อบัญญัติเมืองพัทยา/g, '芭提雅市条例'], [/ม\.(\d+(?:\/\d+)?)/g, '第$1条'], [/บทลงโทษ/g, '罚则'], [/วรรคหนึ่ง/g, '第1款'], [/วรรคสอง/g, '第2款'], [/วรรคสาม/g, '第3款'], [/ข้อ /g, '第 ']],
  ru: [[/พ\.ร\.บ\.รักษาความสะอาดและความเป็นระเบียบเรียบร้อยของบ้านเมือง พ\.ศ\. 2535/g, 'Закон о поддержании чистоты и порядка B.E. 2535 (1992)'], [/พ\.ร\.บ\.การสาธารณสุข พ\.ศ\. 2535/g, 'Закон об общественном здравоохранении B.E. 2535 (1992)'], [/ข้อบัญญัติเมืองพัทยา/g, 'Постановление города Паттайя'], [/ม\./g, 'ст. '], [/บทลงโทษ/g, 'наказание'], [/วรรคหนึ่ง/g, 'ч. 1'], [/วรรคสอง/g, 'ч. 2'], [/วรรคสาม/g, 'ч. 3'], [/ข้อ /g, 'п. ']]
};
const trRef = (ref, lang) => (REF_TR[lang] || []).reduce((s, [a, b]) => s.replace(a, b), String(ref || ''));
const dec = u => { try { return decodeURI(u); } catch (e) { return u; } };
const fmtNum = n => Number(n).toLocaleString('en-US');

function lawAnswer(l, lang) {
  const src = [l.url, l.url2].filter(Boolean);
  const has = l.fineAmount != null && l.fineAmount !== '';
  if (lang === 'th') return `⚖️ ${l.title}\n• โทษ: ${has ? 'ปรับ' + l.fine : l.fine}\n• กฎหมาย: ${l.legalRef}${l.summary ? '\n• สรุป: ' + l.summary : ''}\n📎 แหล่งที่มา (ทางราชการ): ${src.join(' , ')}\nหมายเหตุ: ${has ? 'เป็นอัตราสูงสุดตามตัวบท จำนวนที่ต้องชำระจริงเจ้าหน้าที่เป็นผู้กำหนด · ' : ''}ข้อมูลทางการในแหล่งอ้างอิงถูกต้องที่สุดฮะ 👉 #laws`;
  const T = { en: l.titleEn, zh: l.titleZh, ru: l.titleRu }[lang] || l.titleEn || l.title;
  const ref = trRef(l.legalRef, lang);
  if (lang === 'zh') return `⚖️ ${T}\n• 处罚：${has ? '罚款最高 ' + fmtNum(l.fineAmount) + ' 泰铢' : '详见官方来源'}\n• 法律依据：${ref}\n📎 官方来源（泰文）：${src.join(' , ')}\n注：${has ? '此为法定最高金额，实际金额由主管官员决定。' : ''}以官方原文为准。👉 #laws`;
  if (lang === 'ru') return `⚖️ ${T}\n• Наказание: ${has ? 'штраф до ' + fmtNum(l.fineAmount) + ' бат' : 'см. официальный источник'}\n• Основание: ${ref}\n📎 Официальный источник (на тайском): ${src.join(' , ')}\nПримечание: ${has ? 'это максимальная сумма по закону, фактическую сумму определяет уполномоченный сотрудник. ' : ''}Официальный текст имеет приоритет. 👉 #laws`;
  return `⚖️ ${T}\n• Penalty: ${has ? 'fine up to ' + fmtNum(l.fineAmount) + ' THB' : 'see the official source'}\n• Legal basis: ${ref}\n📎 Official source (Thai): ${src.join(' , ')}\nNote: ${has ? 'statutory maximum — the actual amount is set by the competent official. ' : ''}The official text prevails. 👉 #laws`;
}

function knowledgeEntries(c) {
  const bot = c.chatbot || {};
  const kb = (bot.kb || []).map(k => ({ kind: 'kb', keywords: k.keywords || [], q: [k.q], a: { th: k.a, en: k.aEn, zh: k.aZh, ru: k.aRu }, sources: k.source ? [k.source] : [] }));
  const faq = (c.faq || []).map(f => ({ kind: 'faq', keywords: f.keywords || [], q: [f.q], a: { th: f.a, en: f.aEn, zh: f.aZh, ru: f.aRu }, sources: f.source ? [f.source] : [] }));
  const laws = ((c.laws && c.laws.items) || []).map(l => ({ kind: 'law', law: l, keywords: l.keywords || [], q: [l.title, l.titleEn, l.titleZh, l.titleRu].filter(Boolean), sources: [l.url, l.url2].filter(Boolean) }));
  return kb.concat(faq, laws);
}

// คำภาษาอังกฤษต้องตรงทั้งคำ (กัน “tree” ไปตรงกับ “street”) ส่วนไทย/จีน/รัสเซียใช้การมีอยู่ในข้อความ (รองรับคำต่อท้าย/ผันรูป)
const STOP = new Set(['the', 'and', 'for', 'with', 'what', 'how', 'can', 'fine', 'much']);
function hit(m, kk) {
  if (!kk) return false;
  if (/^[a-z0-9 ]+$/.test(kk)) {
    if ((' ' + m + ' ').includes(' ' + kk + ' ') || (kk.length >= 5 && m.includes(kk))) return true;
    // วลีหลายคำ: ถือว่าตรงเมื่อพบทุกคำสำคัญ (เช่น "park my motorbike on the sidewalk" ↔ "park on sidewalk")
    const ws = kk.split(' ').filter(w => w.length > 2 && !STOP.has(w));
    return ws.length > 1 && ws.every(w => new RegExp('\\b' + w + '(s|ing|ed)?\\b').test(m));
  }
  return m.includes(kk);
}
function score(message, e) {
  const m = norm(message);
  let s = 0;
  for (const k of e.keywords) { const kk = norm(k); if (hit(m, kk)) s += 1 + Math.min(kk.length, 8) / 8; }
  let d = 0; for (const q of e.q) d = Math.max(d, dice(message, q));
  s += d * 2.5;
  if (e.kind === 'law' && /ปรับ|โทษ|ผิด|fine|penalt|illegal|allowed|罚|违法|штраф|наказ|запрещ/i.test(message)) s += 0.4;
  return s;
}

function offlineAnswer(message, c, uiLang) {
  const bot = c.chatbot || {};
  const lang = detectLang(message, uiLang);
  let best = null, bestScore = 0;
  let bestLaw = null, bestLawScore = 0;
  for (const e of knowledgeEntries(c)) {
    const sc = score(message, e);
    if (sc > bestScore) { bestScore = sc; best = e; }
    if (e.kind === 'law' && sc > bestLawScore && e.keywords.some(k => hit(norm(message), norm(k)))) { bestLawScore = sc; bestLaw = e; }
  }
  // ถ้าถามเรื่องเฉพาะ (เช่น “พ่นสีปรับเท่าไร”) ให้ตอบรายการกฎหมายที่ตรงหัวข้อ แทนคำตอบภาพรวม “ข้อบัญญัติและค่าปรับ”
  if (bestLaw && best && best.kind !== 'law' && (best.keywords || []).includes('ข้อบัญญัติ')) { best = bestLaw; bestScore = Math.max(bestScore, bestLawScore); }
  if (best && bestScore >= 0.9) {
    let reply;
    if (best.kind === 'law') reply = lawAnswer(best.law, lang);
    else {
      reply = best.a[lang] || (lang !== 'th' && best.a.en) || best.a.th;
      if (best.sources.length && !/https?:\/\//.test(reply)) reply += `\n📎 ${best.sources.join(' , ')}`;
    }
    return { reply: applyParticle(fill(reply, c), lang, c), lang, matched: best.q[0], sources: best.sources, score: +bestScore.toFixed(2) };
  }
  const fb = (bot.fallbackI18n || {})[lang] || (lang === 'th' ? bot.fallback : bot.fallbackEn) || bot.fallback;
  return { reply: applyParticle(fill(fb, c), lang, c), lang, matched: null, sources: [], score: +bestScore.toFixed(2) };
}

// คำลงท้ายภาษาไทยของน้องอัศวิน (ค่าเริ่มต้น "ฮะ" แก้ได้ในหลังบ้าน chatbot.particle) — เปลี่ยนเฉพาะคำลงท้ายประโยค ไม่แตะเนื้อหากฎหมาย
const PARTICLE_RE = /(ครับ|ค่ะ|ฮะ)(?=$|[\s.!?,)…👉🙏—:]|\n)/gu;
function applyParticle(text, lang, c) {
  if (lang !== 'th') return text;
  const p = (c.chatbot || {}).particle;
  if (p == null || p === 'ฮะ') return String(text).replace(/(ครับ|ค่ะ)(?=$|[\s.!?,)…👉🙏—:]|\n)/gu, 'ฮะ');
  return String(text).replace(PARTICLE_RE, p);
}

function buildSystemPrompt(c, lang) {
  const bot = c.chatbot || {}, s = c.site || {};
  const lw = c.laws || {};
  // แหล่งที่มาแบบอ้างอิง [S#] (URL เต็มอยู่ในรายการเดียว ลดขนาด prompt)
  const srcIds = new Map();
  const sid = u => { if (!srcIds.has(u)) srcIds.set(u, 'S' + (srcIds.size + 1)); return srcIds.get(u); };
  const laws = (lw.items || []).map(l => `- [${l.category}] ${l.title} (EN: ${l.titleEn || '-'}) | โทษ: ${l.fine} | กฎหมาย: ${l.legalRef} | สรุป: ${l.summary || '-'} | SOURCE: ${[l.url, l.url2].filter(Boolean).map(sid).join(', ')}`).join('\n');
  (lw.sources || []).forEach(x => sid(x.url));
  const refUrls = t => String(t || '').replace(/https?:\/\/[^\s,)]+/g, u => u.length > 60 ? `[${sid(u)}]` : u);
  const kb = knowledgeEntries(c).filter(e => e.kind !== 'law').map(e => `Q: ${e.q[0]}\nA: ${refUrls(fill(e.a.th, c))}${e.a.en ? `\nA(EN): ${refUrls(fill(e.a.en, c))}` : ''}${e.sources.length ? `\nSOURCE: ${e.sources.map(sid).join(', ')}` : ''}`).join('\n\n');
  const srcList = [...srcIds].map(([u, id]) => `[${id}] ${u}`).join('\n');
  const knowledge = [
    `ชื่อหน่วยงาน: ${s.name} (${s.englishName}) — ${s.subtitle}`,
    `สายด่วน: ${s.hotline} | อีเมล: ${s.email} | LINE: ${s.lineId} | ที่อยู่: ${s.address} | เวลาทำการ: ${s.hours}`,
    `บริการบนเว็บไซต์: ${(c.services || []).map(x => x.title).join(', ')}`,
    `กฎหมาย/ข้อบัญญัติ/ค่าปรับ (สรุปจากแหล่งทางราชการ ตรวจสอบล่าสุด ${lw.lastChecked || '-'}; ${lw.disclaimer || ''}):\n${laws}`,
    `แหล่งข้อมูลทางการ (เมื่ออ้างอิง ให้คัดลอก URL เต็มของ [S#] ที่ใช้ลงในคำตอบ):\n${srcList}\nรายชื่อแหล่ง: ${(lw.sources || []).map(x => `${x.name} [${sid(x.url)}]`).join(' ; ')}`,
    (c.tourist && (c.tourist.tips || []).length) ? `เคล็ดลับนักท่องเที่ยว: ${c.tourist.tips.map(t => `${t.title} — ${t.desc}`).join('; ')}` : '',
    `คำถามที่พบบ่อย:\n${kb}`
  ].filter(Boolean).join('\n\n');
  return String(bot.systemPrompt || '')
    .replace(/\{botName\}/g, bot.name || '').replace(/\{siteName\}/g, s.name || '').replace(/\{englishName\}/g, s.englishName || '')
    .replace(/\{subtitle\}/g, s.subtitle || '').replace(/\{lang\}/g, LANG_NAME[lang || 'th']).replace(/\{particle\}/g, bot.particle == null ? 'ฮะ' : bot.particle).replace(/\{knowledge\}/g, knowledge);
}

async function llmAnswer(message, history, c, lang) {
  const base = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  const msgs = [{ role: 'system', content: buildSystemPrompt(c, lang) }];
  for (const h of (Array.isArray(history) ? history : []).slice(-10)) {
    if ((h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string') msgs.push({ role: h.role, content: h.content.slice(0, 1500) });
  }
  msgs.push({ role: 'user', content: message });
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ model, messages: msgs, temperature: 0.1, max_tokens: 700 })
    });
    if (!r.ok) throw new Error(`LLM HTTP ${r.status}`);
    const j = await r.json();
    const reply = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!reply) throw new Error('LLM empty reply');
    return reply.trim();
  } finally { clearTimeout(t); }
}

async function answer(message, history, content, uiLang) {
  const off = offlineAnswer(message, content, uiLang);
  if (process.env.AI_API_KEY) {
    try {
      let reply = await llmAnswer(message, history, content, off.lang);
      // กันพลาด: ถ้าเป็นคำถามกฎหมายที่จับคู่แหล่งที่มาได้ แต่ LLM ไม่ใส่ลิงก์ → แนบลิงก์ทางการให้
      if (off.sources.length && !/https?:\/\//.test(reply)) reply += `\n📎 ${off.sources.join(' , ')}`;
      reply = applyParticle(reply, off.lang, content);
      return { mode: 'llm', lang: off.lang, reply, sources: off.sources };
    } catch (e) { console.warn('[chat] LLM error, fallback to offline:', e.message); }
  }
  return { mode: 'offline', ...off };
}

module.exports = { answer, offlineAnswer, buildSystemPrompt, detectLang, applyParticle, LANGS };
