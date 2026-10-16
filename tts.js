/* Server TTS (ไม่บังคับ) — เสียงคุณภาพสูงกว่าเสียงในเบราว์เซอร์
 * TTS_PROVIDER=openai : เรียก OpenAI-compatible POST {TTS_BASE_URL|AI_BASE_URL}/audio/speech (กุญแจ TTS_API_KEY หรือ AI_API_KEY)
 *                       TTS_MODEL (ค่าเริ่มต้น gpt-4o-mini-tts) · TTS_VOICE_FEMALE (nova) · TTS_VOICE_MALE (echo — เสียงผู้ชายนุ่ม ๆ ค่าเริ่มต้นของน้องAI)
 * TTS_PROVIDER=google : Google Cloud Text-to-Speech REST ด้วย GOOGLE_TTS_API_KEY (ไม่ใช่กุญแจ Maps; จำกัด API ให้เฉพาะ Text-to-Speech)
 *                       เลือกเสียงเจาะจงได้ด้วย GOOGLE_TTS_VOICE_TH / _EN / _ZH / _RU (เช่น เสียงผู้ชายภาษาไทยรุ่น Chirp3-HD) ไม่ตั้ง = ให้ Google เลือกตาม ssmlGender
 * ไม่ตั้ง = ปิด → หน้าเว็บใช้ speechSynthesis ของเบราว์เซอร์ (ฟรี ไม่ต้องมีกุญแจ) · กุญแจอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น */
'use strict';
const crypto = require('crypto');
const GLANG = { th: 'th-TH', en: 'en-US', zh: 'cmn-CN', ru: 'ru-RU' };
const cache = new Map(); // LRU เล็ก ๆ ลดค่าใช้จ่ายเมื่อพูดประโยคเดิม (เช่น คำทักทาย)

function provider() {
  const p = String(process.env.TTS_PROVIDER || '').toLowerCase();
  if (p === 'openai' && (process.env.TTS_API_KEY || process.env.AI_API_KEY)) return 'openai';
  if (p === 'google' && process.env.GOOGLE_TTS_API_KEY) return 'google';
  return null;
}

async function synth(text, lang, gender, rate) {
  const p = provider(); if (!p) throw new Error('tts not configured');
  lang = GLANG[lang] ? lang : 'th';
  gender = gender === 'male' ? 'male' : 'female';
  rate = Math.min(1.5, Math.max(0.7, Number(rate) || 1));
  const key = crypto.createHash('sha1').update([p, lang, gender, rate, text].join('|')).digest('hex');
  if (cache.has(key)) { const v = cache.get(key); cache.delete(key); cache.set(key, v); return v; }
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
  let buf;
  try {
    if (p === 'openai') {
      const base = (process.env.TTS_BASE_URL || process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const r = await fetch(base + '/audio/speech', {
        method: 'POST', signal: ctl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (process.env.TTS_API_KEY || process.env.AI_API_KEY) },
        body: JSON.stringify({ model: process.env.TTS_MODEL || 'gpt-4o-mini-tts', input: text, response_format: 'mp3', speed: rate,
          voice: gender === 'male' ? (process.env.TTS_VOICE_MALE || 'echo') : (process.env.TTS_VOICE_FEMALE || 'nova') })
      });
      if (!r.ok) throw new Error('tts upstream ' + r.status);
      buf = Buffer.from(await r.arrayBuffer());
    } else {
      const r = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(process.env.GOOGLE_TTS_API_KEY), {
        method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { text }, voice: Object.assign({ languageCode: GLANG[lang], ssmlGender: gender.toUpperCase() }, process.env['GOOGLE_TTS_VOICE_' + lang.toUpperCase()] ? { name: process.env['GOOGLE_TTS_VOICE_' + lang.toUpperCase()] } : {}), audioConfig: { audioEncoding: 'MP3', speakingRate: rate } })
      });
      if (!r.ok) throw new Error('tts upstream ' + r.status);
      const j = await r.json(); buf = Buffer.from(j.audioContent || '', 'base64');
    }
  } finally { clearTimeout(t); }
  if (!buf || !buf.length) throw new Error('empty audio');
  cache.set(key, buf); if (cache.size > 60) cache.delete(cache.keys().next().value);
  return buf;
}
module.exports = { provider, synth };
