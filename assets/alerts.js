/* แจ้งเหตุบนถนน (Waze-style) — ฝั่งหน้าเว็บ
 * - รับข้อมูลเรียลไทม์จาก /api/alerts/stream (SSE) และสำรองด้วย polling ทุก 15 วินาที
 * - แสดงหมุดบนแผนที่ผ่าน adapter (Leaflet หรือ Google Maps) ที่ assets/traffic.js ส่งมา
 * - ฟอร์มแจ้งเหตุใช้แผนที่ Leaflet ขนาดเล็กสำหรับปักหมุด (ใช้ได้ทั้งสองโหมด) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var cfg = {}, types = {}, store = {}, markers = {}, adapter = null, filter = 'all', myIds = {}, voted = {};
  var notifyOn = false, myPos = null, es = null, pollTimer = null, sseFails = 0;
  try { voted = JSON.parse(localStorage.getItem('tkpVoted') || '{}'); } catch (e) {}

  var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat('th', { numeric: 'auto' }) : null;
  function ago(iso) {
    var s = (Date.parse(iso) - Date.now()) / 1000, a = Math.abs(s);
    if (a < 45) return 'เมื่อสักครู่';
    var u = a < 3600 ? ['minute', 60] : a < 86400 ? ['hour', 3600] : ['day', 86400];
    var v = Math.round(s / u[1]);
    return rtf ? rtf.format(v, u[0]) : Math.abs(v) + ' ' + ({ minute: 'นาที', hour: 'ชม.', day: 'วัน' })[u[0]] + 'ที่แล้ว';
  }
  function left(iso) {
    var m = Math.round((Date.parse(iso) - Date.now()) / 60000);
    return m < 60 ? 'อีก ' + Math.max(m, 1) + ' นาที' : m < 1440 ? 'อีก ' + Math.round(m / 60) + ' ชม.' : 'อีก ' + Math.round(m / 1440) + ' วัน';
  }
  function km(a, b) { var R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lng - a.lng) * r; var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2); return 2 * R * Math.asin(Math.sqrt(h)); }
  function T(a) { return types[a.type] || { label: a.type, emoji: '📍', color: '#64748b' }; }
  function toast(msg, kind) { if (window.TKPToast) window.TKPToast(msg, kind); else console.log(msg); }
  function tick() { var el = $('#trafficClock'); if (el) el.textContent = new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.'; }
  function active(a) { return Date.parse(a.expiresAt) > Date.now(); }
  function badges(a) {
    return (a.official ? '<span class="inline-flex items-center gap-1 rounded-full bg-navy-900 text-gold-300 text-[10px] font-head font-semibold px-2 py-0.5">✔ ประกาศทางการ</span>' : '') +
      (a.pinned ? '<span class="rounded-full bg-gold-100 text-gold-700 text-[10px] font-head font-semibold px-2 py-0.5">📌 ปักหมุด</span>' : '') +
      (a.isExample ? '<span class="rounded-full bg-amber-100 text-amber-800 ring-1 ring-amber-300 text-[10px] font-head font-semibold px-2 py-0.5">ตัวอย่าง</span>' : '');
  }
  function pinHtml(a, fresh) { var t = T(a); return '<div class="alert-pin' + (a.official ? ' official' : '') + (fresh ? ' fresh' : '') + '" style="--c:' + esc(t.color) + '" title="' + esc(t.label) + '"><span>' + t.emoji + '</span></div>'; }
  function voteBtns(a, small) {
    var v = voted[a.id], cls = small ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
    return '<div class="flex gap-1.5 mt-2">' +
      '<button type="button" data-vote="' + a.id + ':up" class="' + cls + ' rounded-full font-head font-medium ' + (v === 'up' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100') + '"' + (v ? ' disabled' : '') + ' title="ยังมีเหตุอยู่ (ต่ออายุ)">👍 ยังอยู่ ' + (a.up || 0) + '</button>' +
      '<button type="button" data-vote="' + a.id + ':down" class="' + cls + ' rounded-full font-head font-medium ' + (v === 'down' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') + '"' + (v ? ' disabled' : '') + ' title="เหตุหายไปแล้ว">👎 ไม่อยู่แล้ว ' + (a.down || 0) + '</button></div>';
  }
  function popupHtml(a) {
    var t = T(a);
    return '<div class="text-slate-700" style="min-width:210px">' +
      '<div class="flex items-center gap-2"><span class="w-8 h-8 rounded-full flex items-center justify-center text-base" style="background:' + esc(t.color) + '22">' + t.emoji + '</span><div><p class="font-head font-semibold text-navy-900 leading-tight" style="margin:0">' + esc(t.label) + '</p><p class="text-[11px] text-slate-500" style="margin:0">' + ago(a.createdAt) + ' · หมดอายุ' + left(a.expiresAt) + '</p></div></div>' +
      '<div class="flex flex-wrap gap-1 mt-1.5">' + badges(a) + '</div>' +
      (a.note ? '<p class="mt-1.5 text-sm" style="margin:6px 0 0">' + esc(a.note) + '</p>' : '') +
      (a.photo ? '<a href="' + esc(a.photo) + '" target="_blank" rel="noopener"><img src="' + esc(a.photo) + '" alt="ภาพประกอบการแจ้งเหตุ" class="mt-2 w-full h-32 object-cover rounded-lg" loading="lazy"></a>' : '') +
      (a.official ? '' : voteBtns(a)) + '</div>';
  }

  // ---------- store & render ----------
  function upsert(a, isNew) {
    if (!active(a)) return remove(a.id);
    var had = !!store[a.id];
    store[a.id] = a;
    if (adapter) {
      if (markers[a.id]) markers[a.id].refresh(pinHtml(a));
      else markers[a.id] = adapter.add(a, pinHtml(a, had ? false : isNew), function () { return popupHtml(store[a.id] || a); }, T(a));
    }
    renderList(isNew && !had ? a.id : null);
    if (isNew && !had && !myIds[a.id]) maybeNotify(a);
  }
  function remove(id) {
    if (markers[id]) { markers[id].remove(); delete markers[id]; }
    if (store[id]) { delete store[id]; renderList(); }
  }
  function sorted() { return Object.keys(store).map(function (k) { return store[k]; }).filter(active).sort(function (x, y) { return (y.pinned - x.pinned) || (y.official - x.official) * 0 || (Date.parse(y.createdAt) - Date.parse(x.createdAt)); }); }
  function renderFilter() {
    var list = cfg.types || [];
    $('#alertsFilter').innerHTML = '<button type="button" data-af="all" class="af shrink-0 rounded-full px-3 py-1.5 text-xs font-head font-medium ring-1 ring-slate-200">ทั้งหมด</button>' +
      list.map(function (t) { return '<button type="button" data-af="' + esc(t.key) + '" class="af shrink-0 rounded-full px-3 py-1.5 text-xs font-head font-medium ring-1 ring-slate-200 whitespace-nowrap" title="' + esc(t.labelEn) + '">' + t.emoji + ' ' + esc(t.label) + '</button>'; }).join('');
    paintFilter();
  }
  function paintFilter() { Array.prototype.forEach.call(document.querySelectorAll('.af'), function (b) { var on = b.dataset.af === filter; b.classList.toggle('bg-navy-900', on); b.classList.toggle('text-white', on); b.classList.toggle('ring-navy-900', on); b.classList.toggle('bg-white', !on); }); }
  function renderList(flashId) {
    var all = sorted(), items = all.filter(function (a) { return filter === 'all' || a.type === filter; });
    $('#alertsCount').textContent = all.length;
    var ul = $('#alertsList');
    if (!items.length) {
      ul.innerHTML = '<li class="h-full flex flex-col items-center justify-center text-center px-6 py-10 text-slate-500"><span class="text-4xl">🛣️</span><p class="mt-3 font-head font-semibold text-navy-900">ยังไม่มีการแจ้งเหตุ' + (filter === 'all' ? 'ในขณะนี้' : 'ประเภทนี้') + '</p><p class="text-sm mt-1">พบเหตุบนถนน? กด “แจ้งเหตุบนแผนที่” เพื่อช่วยเพื่อนร่วมทาง</p></li>';
      return;
    }
    ul.innerHTML = items.map(function (a) {
      var t = T(a), d = myPos ? ' · ' + km(myPos, a).toFixed(1) + ' กม.' : '';
      return '<li class="rounded-2xl ring-1 ring-slate-100 hover:ring-gold-400 hover:bg-gold-100/30 transition' + (a.id === flashId ? ' alert-flash' : '') + '">' +
        '<div class="flex gap-3 p-3">' +
        '<button type="button" data-goto="' + a.id + '" class="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl" style="background:' + esc(t.color) + '1f;box-shadow:inset 0 0 0 2px ' + esc(t.color) + '55" aria-label="ดูบนแผนที่: ' + esc(t.label) + '">' + t.emoji + '</button>' +
        '<div class="min-w-0 flex-1">' +
        '<button type="button" data-goto="' + a.id + '" class="text-left w-full"><div class="flex flex-wrap items-center gap-1.5"><span class="font-head font-semibold text-navy-900 text-[15px] leading-tight">' + esc(t.label) + '</span>' + badges(a) + '</div>' +
        (a.note ? '<p class="text-sm text-slate-600 leading-snug mt-0.5 line-clamp-2">' + esc(a.note) + '</p>' : '') +
        '<p class="text-[11px] text-slate-400 mt-0.5">' + ago(a.createdAt) + d + (a.photo ? ' · 📷' : '') + '</p></button>' +
        (a.official ? '' : voteBtns(a, true)) + '</div></div></li>';
    }).join('');
  }

  // ---------- realtime ----------
  function syncAll() {
    return fetch('/api/alerts', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (list) {
      var seen = {};
      list.forEach(function (a) { seen[a.id] = 1; upsert(a, false); });
      Object.keys(store).forEach(function (id) { if (!seen[id]) remove(id); });
      if (adapter && adapter.fitAll && !syncAll.fitted && list.length) { syncAll.fitted = 1; }
      tick();
    }).catch(function () {});
  }
  function startPolling() { if (pollTimer) return; pollTimer = setInterval(function () { if (!document.hidden) syncAll(); }, 15000); }
  function connect() {
    if (!window.EventSource) return startPolling();
    es = new EventSource('/api/alerts/stream');
    es.addEventListener('upsert', function (e) { try { upsert(JSON.parse(e.data), true); tick(); } catch (x) {} });
    es.addEventListener('remove', function (e) { try { remove(JSON.parse(e.data).id); tick(); } catch (x) {} });
    es.onopen = function () { sseFails = 0; if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } };
    es.onerror = function () { if (++sseFails >= 3) { es.close(); startPolling(); } };
  }
  setInterval(function () { Object.keys(store).forEach(function (id) { if (!active(store[id])) remove(id); }); renderList(); }, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) syncAll(); });

  // ---------- notifications (opt-in) ----------
  function maybeNotify(a) {
    if (!notifyOn || !myPos) return;
    var d = km(myPos, a); if (d > (cfg.nearbyNotifyKm || 2)) return;
    var t = T(a), msg = t.emoji + ' ' + t.label + ' ห่างจากคุณ ' + d.toFixed(1) + ' กม.' + (a.note ? ' — ' + a.note : '');
    toast(msg);
    if ('Notification' in window && Notification.permission === 'granted') {
      try { var n = new Notification('เทศกิจพัทยา · แจ้งเหตุใกล้คุณ', { body: msg, icon: 'assets/favicon.png', tag: a.id }); n.onclick = function () { window.focus(); goto(a.id); }; } catch (e) {}
    }
  }
  function enableNotify() {
    var btn = $('#alertsNotify');
    if (notifyOn) { notifyOn = false; btn.setAttribute('aria-pressed', 'false'); btn.classList.remove('bg-gold-500'); toast('ปิดการแจ้งเตือนเหตุใกล้คุณแล้ว'); return; }
    if (!navigator.geolocation) return toast('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง', 'error');
    navigator.geolocation.watchPosition(function (p) { myPos = { lat: p.coords.latitude, lng: p.coords.longitude }; renderList(); },
      function () { toast('ไม่สามารถเข้าถึงตำแหน่งได้ — โปรดอนุญาตการเข้าถึงตำแหน่ง', 'error'); notifyOn = false; btn.classList.remove('bg-gold-500'); }, { enableHighAccuracy: false, maximumAge: 60000 });
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    notifyOn = true; btn.setAttribute('aria-pressed', 'true'); btn.classList.add('bg-gold-500');
    toast('เปิดการแจ้งเตือนเมื่อมีเหตุภายใน ' + (cfg.nearbyNotifyKm || 2) + ' กม. จากคุณ', 'success');
  }

  // ---------- actions ----------
  function goto(id, z) {
    var a = store[id]; if (!a || !adapter) return;
    var card = $('#trafficCard'); if (card.getBoundingClientRect().top < 0 || card.getBoundingClientRect().bottom > innerHeight) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    adapter.flyTo(a.lat, a.lng, z || 17);
    setTimeout(function () { markers[id] && markers[id].open(); }, adapter.kind === 'leaflet' ? 1100 : 1500);
  }
  function vote(id, v) {
    fetch('/api/alerts/' + encodeURIComponent(id) + '/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vote: v }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j, s: r.status }; }); })
      .then(function (x) {
        if (x.ok || x.s === 409) { voted[id] = v; try { localStorage.setItem('tkpVoted', JSON.stringify(voted)); } catch (e) {} }
        if (x.ok) { toast(v === 'up' ? 'ขอบคุณที่ยืนยัน — ต่ออายุการแจ้งเหตุแล้ว' : 'ขอบคุณ — บันทึกว่าเหตุหายไปแล้ว', 'success'); upsert(x.j, false); }
        else { toast(x.j.error || 'ไม่สำเร็จ', 'error'); if (x.j.alert) upsert(x.j.alert, false); else if (x.s === 404) remove(id); }
      }).catch(function () { toast('เชื่อมต่อไม่ได้', 'error'); });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-vote]'); if (b) { e.preventDefault(); var p = b.dataset.vote.split(':'); b.disabled = true; return vote(p[0], p[1]); }
    var g = e.target.closest('[data-goto]'); if (g) return goto(g.dataset.goto);
    var f = e.target.closest('[data-af]'); if (f) { filter = f.dataset.af; paintFilter(); renderList(); return; }
    if (e.target.closest('[data-open-report]')) return openReport(true);
    if (e.target.closest('[data-close-report]')) return openReport(false);
  });

  // ---------- report sheet ----------
  var rmap = null, rType = null, opened = false;
  function openReport(on) {
    var m = $('#rModal'); if (!m) return;
    if (on) {
      m.classList.remove('hidden'); document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { $('#rBackdrop').classList.add('opacity-100'); $('#rSheet').classList.remove('translate-y-full', 'opacity-0'); });
      $('#reportForm').dataset.t = Date.now();
      setTimeout(initPicker, 60); opened = true;
    } else {
      $('#rBackdrop').classList.remove('opacity-100'); $('#rSheet').classList.add('translate-y-full', 'opacity-0');
      setTimeout(function () { m.classList.add('hidden'); document.body.style.overflow = ''; }, 280); opened = false;
    }
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && opened) openReport(false); });
  function coords() { if (!rmap) return; var c = rmap.getCenter(); $('#rCoords').textContent = 'พิกัด ' + c.lat.toFixed(5) + ', ' + c.lng.toFixed(5); }
  function initPicker() {
    var start = adapter ? adapter.center() : (cfg.center || { lat: 12.9276, lng: 100.8771 });
    if (!window.L) { $('#rCoords').textContent = 'โหลดแผนที่ไม่สำเร็จ — ใช้ปุ่ม GPS แทน'; return; }
    if (!rmap) {
      rmap = L.map('rMap', { zoomControl: true, attributionControl: true, zoomSnap: 0.5 }).setView([start.lat, start.lng], 16);
      rmap.attributionControl.setPrefix(false);
      L.tileLayer(cfg.tileUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: cfg.tileAttribution || '&copy; OpenStreetMap contributors' }).addTo(rmap);
      rmap.on('move', coords);
    } else { rmap.invalidateSize(); rmap.setView([start.lat, start.lng], Math.max(rmap.getZoom(), 16)); }
    setTimeout(function () { rmap.invalidateSize(); coords(); }, 320);
  }
  function renderTypes() {
    $('#rTypes').innerHTML = (cfg.types || []).map(function (t) {
      return '<button type="button" data-rtype="' + esc(t.key) + '" class="rtype rounded-2xl ring-1 ring-slate-200 hover:ring-gold-500 px-2 py-3 text-center transition" aria-pressed="false"><span class="block text-2xl">' + t.emoji + '</span><span class="block mt-1 font-head text-[13px] leading-tight text-navy-900">' + esc(t.label) + '</span></button>';
    }).join('');
    $('#rTypes').addEventListener('click', function (e) {
      var b = e.target.closest('[data-rtype]'); if (!b) return; rType = b.dataset.rtype;
      Array.prototype.forEach.call(document.querySelectorAll('.rtype'), function (x) { var on = x === b; x.setAttribute('aria-pressed', on); x.classList.toggle('ring-2', on); x.classList.toggle('ring-gold-500', on); x.classList.toggle('bg-gold-100', on); });
    });
  }
  function bindForm() {
    var f = $('#reportForm');
    $('#rNote').maxLength = cfg.maxNoteLength || 140;
    $('#rNote').addEventListener('input', function () { $('#rNoteCount').textContent = this.value.length + '/' + (cfg.maxNoteLength || 140); });
    $('#rPhoto').addEventListener('change', function () {
      var file = this.files[0], max = (cfg.maxPhotoMB || 5) * 1048576;
      if (file && file.size > max) { toast('รูปต้องไม่เกิน ' + (cfg.maxPhotoMB || 5) + ' MB', 'error'); this.value = ''; file = null; }
      $('#rPhotoPrev').classList.toggle('hidden', !file); $('#rPhotoLabel').textContent = file ? 'เปลี่ยนรูป' : '📷 แนบรูป';
      if (file) $('#rPhotoPrev').src = URL.createObjectURL(file);
    });
    $('#rGps').addEventListener('click', function () {
      if (!navigator.geolocation) return toast('อุปกรณ์นี้ไม่รองรับ GPS', 'error');
      var b = this; b.textContent = 'กำลังหาตำแหน่ง…';
      navigator.geolocation.getCurrentPosition(function (p) { b.textContent = '◎ ใช้ GPS'; if (rmap) rmap.setView([p.coords.latitude, p.coords.longitude], 18); },
        function () { b.textContent = '◎ ใช้ GPS'; toast('ไม่สามารถเข้าถึงตำแหน่งได้ — เลื่อนแผนที่ปักหมุดเองได้', 'error'); }, { enableHighAccuracy: true, timeout: 10000 });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!rType) return toast('กรุณาเลือกประเภทเหตุ', 'error');
      if (!rmap) return toast('กรุณาระบุตำแหน่ง', 'error');
      var c = rmap.getCenter(), fd = new FormData(f);
      fd.append('type', rType); fd.append('lat', c.lat); fd.append('lng', c.lng); fd.append('t', f.dataset.t || '');
      var btn = $('#rSubmit'); btn.disabled = true; btn.textContent = 'กำลังส่ง…';
      fetch('/api/alerts', { method: 'POST', body: fd }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok) throw new Error(x.j.error || 'ส่งไม่สำเร็จ');
          if (x.j.id) { myIds[x.j.id] = 1; upsert(x.j, true); }
          toast('แจ้งเหตุเรียบร้อย ขอบคุณที่ช่วยเพื่อนร่วมทาง 🙏', 'success');
          f.reset(); rType = null; renderTypesState(); $('#rPhotoPrev').classList.add('hidden'); $('#rPhotoLabel').textContent = '📷 แนบรูป'; $('#rNoteCount').textContent = '0/' + (cfg.maxNoteLength || 140);
          openReport(false);
          if (x.j.id) setTimeout(function () { goto(x.j.id); }, 350);
        }).catch(function (err) { toast(err.message, 'error'); })
        .then(function () { btn.disabled = false; btn.textContent = 'ส่งการแจ้งเหตุ'; });
    });
  }
  function renderTypesState() { Array.prototype.forEach.call(document.querySelectorAll('.rtype'), function (x) { x.setAttribute('aria-pressed', 'false'); x.classList.remove('ring-2', 'ring-gold-500', 'bg-gold-100'); }); }

  window.TKPAlerts = {
    init: function (c) {
      cfg = c || {};
      if (cfg.enabled === false) { Array.prototype.forEach.call(document.querySelectorAll('.alerts-on'), function (el) { el.classList.add('hidden'); }); return; }
      (cfg.types || []).forEach(function (t) { types[t.key] = t; });
      renderFilter(); renderTypes(); bindForm(); renderList();
      $('#alertsNotify').addEventListener('click', enableNotify);
      syncAll().then(connect);
    },
    attach: function (ad) {
      adapter = ad;
      Object.keys(markers).forEach(function (id) { markers[id].remove(); }); markers = {};
      Object.keys(store).forEach(function (id) { var a = store[id]; markers[id] = adapter.add(a, pinHtml(a), function () { return popupHtml(store[id] || a); }, T(a)); });
    },
    goto: goto,
    _store: store
  };
})();
