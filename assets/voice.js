/* น้องAIเทศกิจพัทยา — เสียงพูด/ฟัง (ฟรี ไม่ต้องใช้กุญแจ)
 * TTS : Web Speech API speechSynthesis (เลือกเสียงตามภาษา th-TH / en-US / zh-CN / ru-RU, ชอบเสียงผู้ชาย)
 *       ถ้าเซิร์ฟเวอร์ตั้ง TTS_PROVIDER ไว้ จะใช้ POST /api/tts (เสียงคุณภาพสูงกว่า) และถอยกลับมาใช้เสียงเบราว์เซอร์เมื่อผิดพลาด
 * STT : SpeechRecognition / webkitSpeechRecognition (Chrome, Edge, Android, Safari) — ไม่รองรับ = ซ่อนปุ่มไมค์
 * หมายเหตุ: เสียงภาษาไทยขึ้นกับอุปกรณ์ (Windows/Edge: Microsoft Niwat/Premwadee/Pattara · Android: Google ไทย · iOS/macOS: Kanya/Narisa) */
(function () {
  'use strict';
  var synth = window.speechSynthesis || null;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var BCP = { th: 'th-TH', en: 'en-US', zh: 'zh-CN', ru: 'ru-RU' };
  var FEMALE = /female|woman|girl|kanya|narisa|premwadee|achara|kanokwan|zira|aria|jenny|michelle|samantha|karen|victoria|susan|hazel|libby|sonia|xiaoxiao|xiaoyi|tingting|huihui|yaoyao|meijia|sinji|milena|svetlana|irina|katya|dariya|ekaterina|siri.*female/i;
  var MALE = /\bmale\b|\bman\b|\bboy\b|niwat|pattara|david|guy|mark|daniel|alex\b|fred|ryan|christopher|eric|andrew|brian|roger|yunxi|yunyang|yunjian|kangkang|liang|pavel|dmitry|maxim|yuri|siri.*male/i;
  var cur = null, audio = null, ctx = null, rafId = 0, gen = 0, server = null, voicesReady = null;

  function detectLang(t) {
    t = String(t || '');
    if (/[\u0E00-\u0E7F]/.test(t)) return 'th';
    if (/[\u3040-\u30ff\u3400-\u9fff]/.test(t)) return 'zh';
    if (/[\u0400-\u04FF]/.test(t)) return 'ru';
    return 'en';
  }
  // ล้างข้อความก่อนอ่าน: ตัด URL / markdown / อีโมจิ / ลิงก์ #section · ขยายคำย่อกฎหมายภาษาไทยให้อ่านลื่น
  function clean(t, lang) {
    t = String(t || '')
      .replace(/https?:\/\/\S+/g, ' ').replace(/\bwww\.\S+/g, ' ').replace(/\b[\w-]+\.(?:go\.th|com|org|net)\S*/g, ' ')
      .replace(/(^|\s)#[a-z][\w-]*/gi, ' ')
      .replace(/[*_`~>#|]+/g, ' ').replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}]/gu, ' ')
      .replace(/[•·→]/g, ', ').replace(/\s*\n+\s*/g, '. ').replace(/\(\s*\)/g, ' ').replace(/\s*[,.]\s*([,.]\s*)+/g, '. ').replace(/\s{2,}/g, ' ').trim()
      .replace(/(^|\.\s)[^.]{0,40}:\s*(?=\.|$)/g, '$1').replace(/\.\s*\./g, '.').trim();
    if (lang === 'th') {
      t = t.replace(/พ\.ร\.บ\./g, 'พระราชบัญญัติ ').replace(/ม\.\s?(\d+)/g, 'มาตรา $1').replace(/พ\.ศ\.\s?/g, 'พุทธศักราช ').replace(/ว\.\s?(\d)/g, 'วรรค $1')
        .replace(/(\d),(\d{3})/g, '$1$2').replace(/0X-XXX-XXXX/g, 'ตามที่แสดงบนหน้าจอ').replace(/\bTKP-[\w-]+/g, 'เลขรับเรื่อง');
    }
    return t.replace(/^[,.\s]+/, '');
  }
  function chunks(t, max) {
    max = max || 180;
    var parts = t.split(/(?<=[.!?。！？])\s+|(?<=ฮะ)\s+/), out = [];
    parts.forEach(function (p) {
      while (p.length > max) { var i = p.lastIndexOf(' ', max); if (i < 40) i = max; out.push(p.slice(0, i)); p = p.slice(i).trim(); }
      if (p.trim()) out.push(p.trim());
    });
    return out;
  }
  function loadVoices() {
    if (!synth) return Promise.resolve([]);
    if (voicesReady) return voicesReady;
    voicesReady = new Promise(function (res) {
      var v = synth.getVoices(); if (v && v.length) return res(v);
      var done = false, fin = function () { if (done) return; done = true; res(synth.getVoices() || []); };
      synth.addEventListener && synth.addEventListener('voiceschanged', fin);
      setTimeout(fin, 1200);
    });
    voicesReady.then(function (v) { if (!v.length) voicesReady = null; }); // ลองใหม่ครั้งหน้า
    return voicesReady;
  }
  function genderOf(v) { var n = v.name + ' ' + (v.voiceURI || ''); return FEMALE.test(n) ? 'female' : MALE.test(n) ? 'male' : '?'; }
  function pick(voices, lang, gender) {
    var bcp = BCP[lang] || lang, best = null, bs = -1e9;
    voices.forEach(function (v) {
      var l = String(v.lang || '').replace('_', '-').toLowerCase(), s = 0;
      if (l === bcp.toLowerCase()) s += 4; else if (l.split('-')[0] === bcp.split('-')[0].toLowerCase()) s += 3; else return;
      var g = genderOf(v);
      if (g === gender) s += 3; else if (g !== '?') s -= 2;
      if (/natural|online|neural|enhanced|premium/i.test(v.name)) s += 1.2;
      if (/google/i.test(v.name)) s += 0.6;
      if (s > bs) { bs = s; best = v; }
    });
    return best;
  }
  function stopAll() {
    gen++;
    if (synth) try { synth.cancel(); } catch (e) {}
    if (audio) { try { audio.pause(); } catch (e) {} audio = null; }
    cancelAnimationFrame(rafId);
    if (cur && cur.onend) { var f = cur.onend; cur = null; f(); } else cur = null;
  }
  function serverStatus() {
    if (server) return server;
    server = fetch('/api/tts/status').then(function (r) { return r.ok ? r.json() : { enabled: false }; }).then(function (j) { return !!j.enabled; }).catch(function () { return false; });
    return server;
  }
  function speakServer(text, lang, cfg, h, my) {
    return fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.slice(0, 600), lang: lang, gender: cfg.gender, rate: cfg.rate }) })
      .then(function (r) { if (!r.ok) throw new Error('tts ' + r.status); return r.blob(); })
      .then(function (b) {
        if (my !== gen) return true;
        var url = URL.createObjectURL(b); audio = new Audio(url);
        return new Promise(function (res, rej) {
          audio.onplay = function () {
            h.onstart && h.onstart();
            // ขยับปากตามความดังของเสียง (WebAudio analyser) — ถ้าใช้ไม่ได้ก็ใช้แอนิเมชันพูดปกติ
            try {
              ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
              var an = ctx.createAnalyser(); an.fftSize = 256; ctx.createMediaElementSource(audio).connect(an); an.connect(ctx.destination);
              var buf = new Uint8Array(an.frequencyBinCount), last = 0;
              (function loop() { if (my !== gen) return; an.getByteTimeDomainData(buf); var m = 0; for (var i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i] - 128)); if (m > 18 && performance.now() - last > 140) { last = performance.now(); h.onboundary && h.onboundary(); } rafId = requestAnimationFrame(loop); })();
            } catch (e) {}
          };
          audio.onended = function () { URL.revokeObjectURL(url); res(true); };
          audio.onerror = function () { URL.revokeObjectURL(url); rej(new Error('audio')); };
          audio.play().catch(rej);
        });
      });
  }
  function speakBrowser(text, lang, cfg, h, my) {
    if (!synth) return Promise.reject(new Error('no speechSynthesis'));
    return loadVoices().then(function (voices) {
      var v = pick(voices, lang, cfg.gender || 'male');
      if (!v) { h.onnovoice && h.onnovoice(lang); return false; }
      var g = genderOf(v), rate = cfg.rate || 1, pitch = cfg.pitch || 1.1;
      // ต้องการเสียงผู้ชายแต่มีแค่เสียงผู้หญิง → ลดระดับเสียงเล็กน้อยให้นุ่มแบบเด็กผู้ชาย
      if ((cfg.gender || 'male') === 'male' && g === 'female') { pitch = 0.88; rate = rate * 0.95; }
      if ((cfg.gender || 'male') === 'female' && g === 'male') { pitch = 1.25; }
      var list = chunks(text), i = 0, started = false;
      return new Promise(function (res) {
        function next() {
          if (my !== gen) return res(true);
          if (i >= list.length) return res(true);
          var u = new SpeechSynthesisUtterance(list[i++]);
          u.voice = v; u.lang = v.lang || BCP[lang]; u.rate = Math.min(1.6, Math.max(0.6, rate)); u.pitch = Math.min(2, Math.max(0.5, pitch)); u.volume = 1;
          u.onstart = function () { if (!started) { started = true; h.onstart && h.onstart(); } };
          u.onboundary = function () { h.onboundary && h.onboundary(); };
          u.onend = next; u.onerror = next;
          synth.speak(u);
        }
        try { synth.cancel(); } catch (e) {}
        next();
      });
    });
  }
  // speak(text, {lang, gender, rate, pitch, serverTts}, {onstart, onend, onboundary, onnovoice})
  function speak(text, cfg, h) {
    h = h || {}; cfg = cfg || {};
    stopAll();
    var lang = cfg.lang || detectLang(text), t = clean(text, lang);
    if (!t) return Promise.resolve(false);
    var my = gen; cur = h;
    var end = function () { if (cur === h) { cur = null; cancelAnimationFrame(rafId); h.onend && h.onend(); } };
    var p = (cfg.serverTts === false ? Promise.resolve(false) : serverStatus())
      .then(function (on) { return on ? speakServer(t, lang, cfg, h, my).catch(function () { return my === gen && speakBrowser(t, lang, cfg, h, my); }) : speakBrowser(t, lang, cfg, h, my); });
    return p.then(function (r) { end(); return r; }, function () { end(); return false; });
  }
  // listen(lang, {oninterim, onfinal, onstart, onend, onerror}) → stop()
  function listen(lang, h) {
    if (!SR) return null;
    h = h || {};
    var r = new SR(), finalText = '', ended = false;
    r.lang = BCP[lang] || 'th-TH'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
    r.onstart = function () { h.onstart && h.onstart(); };
    r.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) { var s = e.results[i][0].transcript; if (e.results[i].isFinal) finalText += s; else interim += s; }
      h.oninterim && h.oninterim((finalText + interim).trim());
    };
    r.onerror = function (e) { h.onerror && h.onerror(e.error || 'error'); };
    r.onend = function () { if (ended) return; ended = true; h.onend && h.onend(); if (finalText.trim()) h.onfinal && h.onfinal(finalText.trim()); };
    try { r.start(); } catch (e) { h.onerror && h.onerror('start'); return null; }
    return function () { try { r.stop(); } catch (e) {} };
  }
  if (synth) loadVoices();
  window.TKPVoice = {
    supported: { tts: !!synth, stt: !!SR },
    speak: speak, stop: stopAll, listen: listen, clean: clean, detectLang: detectLang, voices: loadVoices, pick: pick, genderOf: genderOf,
    serverStatus: serverStatus, speaking: function () { return !!cur; }
  };
})();
