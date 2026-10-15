/**
 * น้องAIเทศกิจพัทยา — chatbot engine
 * โหมด 1 (ค่าเริ่มต้น): ออฟไลน์ ตอบจากฐานความรู้ใน content.json (chatbot.kb + faq) ด้วย keyword + fuzzy matching
 * โหมด 2: ถ้าตั้ง AI_API_KEY จะเรียก LLM แบบ OpenAI-compatible (/chat/completions) — กุญแจอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น
 *   AI_BASE_URL  เช่น https://api.openai.com/v1 | https://api.x.ai/v1 | https://generativelanguage.googleapis.com/v1beta/openai
 *   AI_MODEL     เช่น gpt-4o-mini | grok-3-mini | gemini-2.0-flash
 */
'use strict';

const THAI = /[\u0E00-\u0E7F]/;
const norm = s => String(s || '').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, ' ').trim();
const bigrams = s => { const t = norm(s).replace(/ /g, ''); const out = new Set(); for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2)); return out; };
function dice(a, b) { const A = bigrams(a), B = bigrams(b); if (!A.size || !B.size) return 0; let n = 0; for (const x of A) if (B.has(x)) n++; return (2 * n) / (A.size + B.size); }

function fill(tpl, c) {
  const s = c.site || {};
  const laws = ((c.laws && c.laws.items) || []).map(l => `• ${l.title}: ${l.fine}`).join('\n');
  return String(tpl || '')
    .replace(/\{hotline\}/g, s.hotline || '-').replace(/\{hours\}/g, s.hours || '-').replace(/\{address\}/g, s.address || '-')
    .replace(/\{email\}/g, s.email || '-').replace(/\{lineId\}/g, s.lineId || '-').replace(/\{siteName\}/g, s.name || '')
    .replace(/\{laws\}/g, laws);
}

function knowledgeEntries(c) {
  const bot = c.chatbot || {};
  const kb = (bot.kb || []).map(k => ({ keywords: k.keywords || [], q: k.q || '', a: k.a || '', aEn: k.aEn || '' }));
  const faq = (c.faq || []).map(f => ({ keywords: [], q: f.q || '', a: f.a || '', aEn: '' }));
  return kb.concat(faq);
}

function offlineAnswer(message, c) {
  const bot = c.chatbot || {};
  const isThai = THAI.test(message);
  const m = norm(message);
  let best = null, bestScore = 0;
  for (const e of knowledgeEntries(c)) {
    let score = 0;
    for (const k of e.keywords) { const kk = norm(k); if (kk && m.includes(kk)) score += 1 + Math.min(kk.length, 8) / 8; }
    score += dice(message, e.q) * 2.5;
    if (score > bestScore) { bestScore = score; best = e; }
  }
  if (best && bestScore >= 0.9) {
    const a = !isThai && best.aEn ? best.aEn : best.a;
    return { reply: fill(a, c), matched: best.q, score: +bestScore.toFixed(2) };
  }
  return { reply: fill(!isThai && bot.fallbackEn ? bot.fallbackEn : bot.fallback, c), matched: null, score: +bestScore.toFixed(2) };
}

function buildSystemPrompt(c) {
  const bot = c.chatbot || {}, s = c.site || {};
  const kb = knowledgeEntries(c).map(e => `Q: ${e.q}\nA: ${fill(e.a, c)}${e.aEn ? `\nA(EN): ${fill(e.aEn, c)}` : ''}`).join('\n\n');
  const laws = ((c.laws && c.laws.items) || []).map(l => `- ${l.title}: ${l.fine} (${l.ref})`).join('\n');
  const knowledge = [
    `ชื่อหน่วยงาน: ${s.name} (${s.englishName}) — ${s.subtitle}`,
    `สายด่วน: ${s.hotline} | อีเมล: ${s.email} | LINE: ${s.lineId} | ที่อยู่: ${s.address} | เวลาทำการ: ${s.hours}`,
    `บริการบนเว็บไซต์: ${(c.services || []).map(x => x.title).join(', ')}`,
    `ข้อบัญญัติ/ค่าปรับ (${(c.laws && c.laws.note) || ''}):\n${laws}`,
    `เคล็ดลับนักท่องเที่ยว: ${((c.tourist && c.tourist.tips) || []).map(t => `${t.title} — ${t.desc}`).join('; ')}`,
    `คำถามที่พบบ่อย:\n${kb}`
  ].join('\n\n');
  return String(bot.systemPrompt || '')
    .replace(/\{botName\}/g, bot.name || '').replace(/\{siteName\}/g, s.name || '').replace(/\{englishName\}/g, s.englishName || '')
    .replace(/\{subtitle\}/g, s.subtitle || '').replace(/\{knowledge\}/g, knowledge);
}

async function llmAnswer(message, history, c) {
  const base = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o-mini';
  const msgs = [{ role: 'system', content: buildSystemPrompt(c) }];
  for (const h of (Array.isArray(history) ? history : []).slice(-10)) {
    if ((h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string') msgs.push({ role: h.role, content: h.content.slice(0, 1500) });
  }
  msgs.push({ role: 'user', content: message });
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ model, messages: msgs, temperature: 0.3, max_tokens: 600 })
    });
    if (!r.ok) throw new Error(`LLM HTTP ${r.status}`);
    const j = await r.json();
    const reply = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!reply) throw new Error('LLM empty reply');
    return reply.trim();
  } finally { clearTimeout(t); }
}

async function answer(message, history, content) {
  if (process.env.AI_API_KEY) {
    try { return { mode: 'llm', reply: await llmAnswer(message, history, content) }; }
    catch (e) { console.warn('[chat] LLM error, fallback to offline:', e.message); }
  }
  return { mode: 'offline', ...offlineAnswer(message, content) };
}

module.exports = { answer, offlineAnswer, buildSystemPrompt };
