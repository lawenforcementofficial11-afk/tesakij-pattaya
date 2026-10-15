/* กล้องสด CCTV เมืองพัทยา — แผนที่เป็นหลัก (map-first, 3D)
 * - ไอคอนกล้อง 3 มิติบนแผนที่ (Google vector / MapLibre 3D / Leaflet) ผ่าน adapter.addEl()
 * - คลิกกล้อง → บิน (flyTo + pitch/bearing) ไปยังจุดนั้น แล้วเปิดภาพสดในแผงลอย
 * - ชนิดสตรีมต่อกล้อง (แก้ได้ในหลังบ้าน): hls (.m3u8 ผ่าน hls.js) | youtube | iframe | link (เปิดเว็บไซต์ทางการ)
 * - ระบบของเมืองพัทยา (livestream.pattaya.go.th) ใช้ WebRTC + Cloudflare Turnstile และตั้ง CSP frame-ancestors
 *   อนุญาตเฉพาะ *.pattaya.go.th → ถ้าเว็บนี้โฮสต์บน *.pattaya.go.th จะฝังหน้าเว็บทางการได้ ไม่เช่นนั้นเปิดในแท็บใหม่ */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var cfg = {}, cams = [], pins = {}, adapter = null, cur = -1, shown = true, hls = null;

  function onOfficialHost() { return /(^|\.)pattaya\.go\.th$/i.test(location.hostname); }
  function pinEl(c) {
    var el = document.createElement('div');
    el.className = 'cam-pin' + (c.approx ? ' approx' : '');
    el.title = c.name + (c.approx ? ' (ตำแหน่งโดยประมาณ)' : '');
    el.setAttribute('role', 'button'); el.setAttribute('aria-label', 'เปิดภาพสดกล้อง ' + c.name);
    el.innerHTML = '<div class="head">📹</div><div class="stem"></div><div class="base"></div>';
    return el;
  }
  function ytId(u) { var m = String(u).match(/(?:youtu\.be\/|v=|embed\/|live\/)([\w-]{11})/); return m ? m[1] : null; }
  function loadHls() {
    return new Promise(function (ok, no) {
      if (window.Hls) return ok();
      var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s);
    });
  }
  function stop() { if (hls) { try { hls.destroy(); } catch (e) {} hls = null; } $('#camView').innerHTML = ''; }
  function linkCard(c) {
    return '<div class="absolute inset-0 flex flex-col items-center justify-center text-center p-5 bg-[radial-gradient(ellipse_at_center,#13315C_0%,#050f1f_75%)]">' +
      '<div class="w-14 h-14 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-2xl">📡</div>' +
      '<p class="mt-3 font-head font-semibold">' + esc(c.name) + '</p>' +
      '<p class="mt-1 text-xs text-white/60 max-w-xs leading-snug">' + esc(cfg.linkNotice || '') + '</p>' +
      '<a href="' + esc(c.url || cfg.officialUrl) + '" target="_blank" rel="noopener" class="mt-3 inline-flex items-center gap-2 rounded-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-head font-semibold px-4 py-2 text-sm">▶ ดูภาพสดที่เว็บไซต์เมืองพัทยา ↗</a></div>';
  }
  function play(c) {
    stop();
    var v = $('#camView'), type = c.type || 'link', src = c.src || '';
    if (type === 'hls' && src) {
      v.innerHTML = '<video id="camVideo" class="absolute inset-0 w-full h-full object-cover" muted autoplay playsinline controls></video>';
      var video = $('#camVideo');
      if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = src; return; }
      loadHls().then(function () {
        if (!window.Hls || !Hls.isSupported()) throw new Error('hls unsupported');
        hls = new Hls({ lowLatencyMode: true }); hls.loadSource(src); hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, function (_, d) { if (d.fatal) { stop(); v.innerHTML = linkCard(c); } });
      }).catch(function () { v.innerHTML = linkCard(c); });
    } else if (type === 'youtube' && ytId(src)) {
      v.innerHTML = '<iframe class="absolute inset-0 w-full h-full" src="https://www.youtube-nocookie.com/embed/' + ytId(src) + '?autoplay=1&mute=1&playsinline=1&rel=0" title="' + esc(c.name) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    } else if (type === 'iframe' && /^https:\/\//.test(src)) {
      v.innerHTML = '<iframe class="absolute inset-0 w-full h-full" src="' + esc(src) + '" title="' + esc(c.name) + '" allow="autoplay; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    } else if (cfg.allowOfficialEmbed && onOfficialHost()) {
      v.innerHTML = '<iframe class="absolute inset-0 w-full h-full" src="' + esc(c.url || cfg.officialUrl) + '" title="CCTV เมืองพัทยา" allow="autoplay; fullscreen" allowfullscreen></iframe>';
    } else v.innerHTML = linkCard(c);
  }
  function open(i, fly) {
    var c = cams[i]; if (!c) return;
    cur = i;
    Object.keys(pins).forEach(function (k) { pins[k].el.classList.toggle('on', +k === i); });
    $('#camTitle').textContent = c.name;
    $('#camSub').textContent = (c.nameEn || '') + (c.approx ? ' · ตำแหน่งโดยประมาณ' : '') + (c.isExample ? ' · ตัวอย่าง' : '');
    $('#camOfficial').href = c.url || cfg.officialUrl || 'https://livestream.pattaya.go.th/';
    $('#camPanel').classList.remove('hidden');
    play(c);
    Array.prototype.forEach.call(document.querySelectorAll('[data-cam]'), function (b) { b.classList.toggle('ring-gold-400', +b.dataset.cam === i); b.classList.toggle('ring-2', +b.dataset.cam === i); });
    if (fly !== false && adapter) {
      var wide = innerWidth >= 640;
      adapter.flyTo(c.lat, c.lng, 17.6, { pitch: 62, bearing: c.heading != null ? c.heading : 0, duration: 2200, padding: wide ? { left: 380, top: 0, right: 0, bottom: 0 } : { bottom: 260, top: 0, left: 0, right: 0 } });
    }
  }
  function close() { stop(); cur = -1; $('#camPanel').classList.add('hidden'); Object.keys(pins).forEach(function (k) { pins[k].el.classList.remove('on'); }); }
  function renderStrip() {
    $('#camStrip').innerHTML = cams.map(function (c, i) {
      return '<button type="button" data-cam="' + i + '" class="group shrink-0 w-56 text-left rounded-2xl glass ring-1 ring-white/10 hover:ring-gold-400 p-3 transition">' +
        '<div class="flex items-center gap-3"><span class="relative w-11 h-11 rounded-xl bg-navy-800 ring-1 ring-gold-500/60 flex items-center justify-center text-lg">📹<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-navy-900"></span></span>' +
        '<div class="min-w-0"><p class="font-head font-semibold text-sm leading-tight line-clamp-2">' + esc(c.name) + '</p><p class="text-[11px] text-white/50 truncate">' + esc(c.nameEn || '') + '</p></div></div>' +
        '<div class="mt-2 flex items-center gap-1.5 text-[10px]">' + (c.approx ? '<span class="rounded-full bg-white/10 px-2 py-0.5 whitespace-nowrap">≈ พิกัดโดยประมาณ</span>' : '') + (c.isExample ? '<span class="rounded-full bg-amber-400/20 text-amber-200 px-2 py-0.5">ตัวอย่าง</span>' : '') + '<span class="ml-auto text-gold-300 font-head font-semibold group-hover:translate-x-0.5 transition whitespace-nowrap">ดูบนแผนที่ →</span></div></button>';
    }).join('');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cam]'); if (!b) return;
    var card = $('#trafficCard'), r = card.getBoundingClientRect();
    if (r.top < 60 || r.bottom > innerHeight) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    open(+b.dataset.cam);
  });

  window.TKPCCTV = {
    init: function (c) {
      cfg = c || {};
      cams = (cfg.cameras || []).filter(function (x) { return isFinite(x.lat) && isFinite(x.lng) && x.name; });
      if (cfg.enabled === false || !cams.length) { Array.prototype.forEach.call(document.querySelectorAll('.cctv-on'), function (el) { el.classList.add('hidden'); }); cfg.enabled = false; return; }
      Array.prototype.forEach.call(document.querySelectorAll('[data-cctv-official]'), function (a) { a.href = cfg.officialUrl || a.href; });
      if (!cams.some(function (x) { return x.isExample || x.approx; })) $('#camExNote').classList.add('hidden');
      renderStrip();
      $('#camClose').addEventListener('click', close);
      $('#camPrev').addEventListener('click', function () { open((cur - 1 + cams.length) % cams.length); });
      $('#camNext').addEventListener('click', function () { open((cur + 1) % cams.length); });
      $('#tBtnCam').addEventListener('click', function () {
        shown = !shown; this.classList.toggle('chip-active', shown); this.setAttribute('aria-pressed', String(shown));
        Object.keys(pins).forEach(function (k) { pins[k].h.show(shown); }); if (!shown) close();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur >= 0) close(); });
    },
    attach: function (ad) {
      if (cfg.enabled === false) return;
      adapter = ad;
      Object.keys(pins).forEach(function (k) { pins[k].h.remove(); }); pins = {};
      cams.forEach(function (c, i) { var el = pinEl(c); pins[i] = { el: el, h: ad.addEl(c.lat, c.lng, el, function () { open(i); }) }; });
    },
    open: open, close: close
  };
})();
