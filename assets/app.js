/* เทศกิจพัทยา — frontend (vanilla JS). เนื้อหาทั้งหมดโหลดจาก /api/content (data/content.json) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var safeUrl = function (u) { u = String(u || ''); return /^(https?:\/\/|\/|#|assets\/|uploads\/|tel:|mailto:)/i.test(u) || /^[\w\-./]+$/.test(u) ? u : '#'; };
  var get = function (o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); };

  // ---------- icons ----------
  var P = {
    chat: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
    clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    store: 'M3 9l1.5-5h15L21 9M3 9h18M3 9a3 3 0 006 0m-6 0v11h18V9m-12 0a3 3 0 006 0m0 0a3 3 0 006 0M9 20v-5h6v5',
    scale: 'M12 3v18m-7-4l-2-6h4l-2 6zm14 0l-2-6h4l-2 6zM5 11l7-6 7 6M8 21h8',
    megaphone: 'M11 5.9V19.2a1.8 1.8 0 01-3.4.6l-2.2-6.3M18 13a3 3 0 100-6M5.4 13.5A4 4 0 017 6h1.8C12.9 6 16.4 4.8 18 3v16c-1.6-1.8-5.1-3-9.2-3H7a4 4 0 01-1.6-.3z',
    pin: 'M17.7 16.7L13.4 21a2 2 0 01-2.8 0l-4.3-4.3a8 8 0 1111.4 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
    phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.49a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z',
    clock: 'M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
    mail: 'M3 8l7.9 5.3a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    search: 'M21 21l-5.2-5.2M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z',
    check: 'M5 13l4 4L19 7',
    globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z',
    arrow: 'M9 5l7 7-7 7',
    edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.6a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z',
    shield: 'M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3zm-3 9l2 2 4-4',
    trash: 'M19 7l-.9 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m5 4v6m4-6v6M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3',
    tag: 'M7 7h.01M7 3h5a2 2 0 011.4.6l7 7a2 2 0 010 2.8l-7 7a2 2 0 01-2.8 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
    doc: 'M9 12h6m-6 4h6M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z',
    image: 'M3 16l4.6-4.6a2 2 0 012.8 0L15 16m-2-2l1.6-1.6a2 2 0 012.8 0L21 16M14 8h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    home: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9z',
    help: 'M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3m.1 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  };
  function icon(name, cls) { return '<svg class="' + (cls || 'w-6 h-6') + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (P[name] || P.doc) + '"/></svg>'; }
  function paintIcons(root) { $$('[data-icon]', root).forEach(function (el) { el.outerHTML = icon(el.getAttribute('data-icon'), el.className); }); }
  window.TKP_ICONS = Object.keys(P);

  // ---------- toast ----------
  var tTimer;
  function toast(title, msg) {
    $('#toastTitle').textContent = title; $('#toastMsg').innerHTML = msg;
    var t = $('#toast'); t.classList.remove('opacity-0', '-translate-y-4');
    clearTimeout(tTimer); tTimer = setTimeout(function () { t.classList.add('opacity-0', '-translate-y-4'); }, 6000);
  }

  window.TKPToast = function (msg, kind) { toast(kind === 'error' ? 'ขออภัย' : kind === 'success' ? 'สำเร็จ' : 'แจ้งเหตุบนถนน', String(msg).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; })); };

  // ---------- reveal ----------
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: .12, rootMargin: '0px 0px -40px 0px' }) : null;
  function observeReveal(root) { $$('.reveal:not(.is-in)', root).forEach(function (el) { io ? io.observe(el) : el.classList.add('is-in'); }); }

  function fmtDate(iso) { try { return new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return iso; } }
  var exBadge = function (on, cls) { return on ? '<span class="' + (cls || '') + ' text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 px-2.5 py-1">เนื้อหาตัวอย่าง</span>' : ''; };


  // ---------- linkify (URL ทางการ + #section) ----------
  function shortUrl(u) { try { var x = new URL(u.replace(/&amp;/g, '&')); return x.hostname.replace(/^www\./, '') + (x.pathname.length > 1 ? '/…' : ''); } catch (e) { return u; } }
  function linkify(t) {
    return esc(t)
      .replace(/https?:\/\/[^\s<>"',]+[^\s<>"',.)]/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener" class="chat-ext underline decoration-sea-500 decoration-2 underline-offset-2 text-navy-800 font-semibold break-all">🔗 ' + esc(shortUrl(u)) + '</a>'; })
      .replace(/(^|[\s(])(#(?:complaint|track|laws|contact|news|faq|tourist|traffic|cctv))\b/g, '$1<a href="$2" class="chat-link underline decoration-gold-500 decoration-2 underline-offset-2 font-semibold">$2</a>')
      .replace(/\n/g, '<br>');
  }

  // ---------- laws (sourced) ----------
  function renderLaws(L) {
    var items = L.items || [], cats = [];
    items.forEach(function (l) { var k = l.category || 'อื่น ๆ'; if (cats.indexOf(k) < 0) cats.push(k); });
    $('#lawsChecked').textContent = L.lastChecked ? new Date(L.lastChecked + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    $('#lawsCount').textContent = items.length + ' รายการ · ' + cats.length + ' หมวด';
    $('#lawCats').innerHTML = ['ทั้งหมด'].concat(cats).map(function (k, i) { return '<button type="button" data-lawcat="' + esc(i ? k : '') + '" class="law-cat shrink-0 rounded-full px-4 py-2 font-head text-sm ring-1 transition ' + (i ? 'bg-white text-navy-900 ring-slate-200 hover:ring-gold-500' : 'bg-navy-900 text-white ring-navy-900') + '">' + esc(k) + '</button>'; }).join('');
    $('#lawGroups').innerHTML = cats.map(function (k) {
      var list = items.filter(function (l) { return (l.category || 'อื่น ๆ') === k; });
      return '<div class="law-group rounded-[24px] bg-white shadow-card ring-1 ring-slate-100 overflow-hidden" data-cat="' + esc(k) + '"><div class="px-5 sm:px-6 py-4 bg-navy-900 text-white flex items-center justify-between gap-3"><h3 class="font-head font-semibold text-lg">' + esc(k) + '</h3><span class="text-xs text-gold-300">' + list.length + ' รายการ</span></div><ul class="divide-y divide-slate-100">' +
        list.map(function (l) {
          var has = l.fineAmount != null && l.fineAmount !== '';
          var links = [l.url, l.url2].filter(Boolean).map(function (u, i) { return '<a href="' + esc(safeUrl(u)) + '" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-navy-800 hover:text-gold-700 underline decoration-gold-500/60 underline-offset-2">' + (i ? 'ตัวบท/สำเนา' : 'แหล่งที่มาทางการ') + ' · ' + esc(shortUrl(u)) + ' ↗</a>'; }).join('<span class="text-slate-300">|</span>');
          return '<li class="px-5 sm:px-6 py-4 grid sm:grid-cols-[1fr_auto] gap-x-6 gap-y-2"><div class="min-w-0"><p class="font-head font-semibold text-navy-900 leading-snug">' + esc(l.title) + '</p>' +
            (l.summary ? '<p class="mt-1 text-sm text-slate-600 leading-relaxed">' + esc(l.summary) + '</p>' : '') +
            '<p class="mt-1.5 text-xs text-slate-500">📜 ' + esc(l.legalRef || l.ref || '') + (l.year ? ' · ปีที่มีผล/ประกาศ พ.ศ. ' + esc(l.year) : '') + '</p>' +
            (links ? '<p class="mt-1.5 text-xs flex flex-wrap gap-x-2 gap-y-1">' + links + '</p>' : '') + '</div>' +
            '<div class="sm:text-right"><span class="inline-block rounded-full ' + (has ? 'bg-navy-900 text-gold-300' : 'bg-slate-100 text-slate-600') + ' text-xs sm:text-sm font-head font-semibold px-3 py-1.5 whitespace-nowrap">' + (has ? 'ปรับ' : '') + esc(l.fine) + '</span>' + (has ? '<p class="mt-1 text-[11px] text-slate-400">อัตราสูงสุดตามตัวบท</p>' : '') + '</div></li>';
        }).join('') + '</ul></div>';
    }).join('');
    $('#lawSources').innerHTML = (L.sources || []).map(function (x) { return '<li class="flex gap-2"><span class="text-gold-600">•</span><a class="text-navy-800 hover:text-gold-700 underline decoration-gold-500/50 underline-offset-2" target="_blank" rel="noopener" href="' + esc(safeUrl(x.url)) + '">' + esc(x.name) + ' ↗</a></li>'; }).join('');
    $$('.law-cat').forEach(function (b) { b.addEventListener('click', function () {
      var k = b.dataset.lawcat;
      $$('.law-cat').forEach(function (x) { var on = x === b; x.classList.toggle('bg-navy-900', on); x.classList.toggle('text-white', on); x.classList.toggle('ring-navy-900', on); x.classList.toggle('bg-white', !on); x.classList.toggle('text-navy-900', !on); });
      $$('.law-group').forEach(function (g) { g.classList.toggle('hidden', !!k && g.dataset.cat !== k); });
    }); });
  }

  // ---------- section layout (admin: เปิด/ปิด + ลากเรียงลำดับ) ----------
  var SEC_LINK = { complaint: 'complaint', track: 'trackStatus', about: 'about', traffic: 'traffic', news: 'news', laws: 'laws', faq: 'faq', tourist: 'tourist', royal: 'royal', services: 'services', cctv: 'cctv' };
  function applyLayout(c) {
    var f = c.features || {}, secs = (c.sections || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var on = {}; secs.forEach(function (x) { on[x.id] = x.enabled !== false; });
    var main = $('#main') || $('main');
    // reorder (hero stays first because it sits under the transparent header)
    secs.forEach(function (x) { var el = $('[data-sec="' + x.id + '"]'); if (el && x.id !== 'hero') main.appendChild(el); });
    $$('[data-sec]').forEach(function (el) { var id = el.dataset.sec; if (id in on && !on[id]) { el.classList.add('hidden'); el.setAttribute('data-off', '1'); } });
    $$('[data-feat]').forEach(function (el) { if (f[el.dataset.feat] === false) { el.classList.add('hidden'); el.setAttribute('data-off', '1'); } });
    if (!on.hero) document.body.classList.add('no-hero');
    // features inside the traffic section
    if (f.alerts === false) { c.alerts = Object.assign({}, c.alerts, { enabled: false }); var g = $('#trafficGrid'); if (g) g.className = g.className.replace(/lg:grid-cols-\[[^\]]+\]/, ''); }
    if (f.cctv === false) c.cctv = Object.assign({}, c.cctv, { enabled: false });
    if (f.simulation === false) c.traffic = Object.assign({}, c.traffic, { simulation: false });
    if (f.chatbot === false) c.chatbot = Object.assign({}, c.chatbot, { enabled: false });
    // track section: if both cards are off, let the about text span the row
    if (f.complaint === false && f.trackStatus === false) { var tc = $('#trackCards'); if (tc) tc.classList.add('hidden'); }
    if (f.about === false) { var tc2 = $('#trackCards'); if (tc2) tc2.classList.replace('lg:col-span-3', 'lg:col-span-5'); }
    if (on.track === false) { f = Object.assign({}, f, { complaint: false, trackStatus: false, about: false }); }
    // hide nav links to things that are off
    var off = { traffic: !on.traffic, news: !on.news, laws: !on.laws, faq: !on.faq, tourist: !on.tourist, royal: !on.royal, services: !on.services, complaint: f.complaint === false, track: f.trackStatus === false, about: f.about === false, cctv: f.cctv === false || !on.traffic };
    $$('a[href^="#"]').forEach(function (a) { var id = a.getAttribute('href').slice(1); if (off[id] && !a.closest('#chatLog')) a.classList.add('hidden'); });
    if (f.mobileBar === false) document.body.classList.add('no-mobilebar');
  }

  // ---------- language (TH / EN / 中文 / РУС) ----------
  var LANG_KEYS = { TH: 'th', EN: 'en', '中文': 'zh', 'РУС': 'ru' }, LANG_UI = { th: 'TH', en: 'EN', zh: '中文', ru: 'РУС' };
  function initialLang() {
    try { var v = localStorage.getItem('tkpLang'); if (v && LANG_UI[v]) return v; } catch (e) {}
    var n = (navigator.language || 'th').toLowerCase();
    return /^zh/.test(n) ? 'zh' : /^ru/.test(n) ? 'ru' : /^th/.test(n) ? 'th' : /^en/.test(n) ? 'en' : 'th';
  }
  var curLang = initialLang();
  window.TKPLang = function () { return curLang; };

  function render(c) {
    var s = c.site || {};
    document.title = (s.name || 'เทศกิจพัทยา') + ' | ' + (s.subtitle || '');
    $$('[data-bind]').forEach(function (el) { var v = get(c, el.getAttribute('data-bind')); if (v != null) el.textContent = v; });
    $$('[data-src]').forEach(function (el) { var v = get(c, el.getAttribute('data-src')); if (v) el.setAttribute('src', safeUrl(v)); });
    $$('[data-srcset]').forEach(function (el) { var v = get(c, el.getAttribute('data-srcset')); if (v) el.setAttribute('srcset', safeUrl(v)); });
    $$('[data-alt]').forEach(function (el) { var v = get(c, el.getAttribute('data-alt')); if (v) el.setAttribute('alt', v); });
    $$('[data-href]').forEach(function (el) { var v = get(c, el.getAttribute('data-href')); if (v) el.setAttribute('href', safeUrl(v)); });
    if (s.favicon) $('link[rel=icon]').href = safeUrl(s.favicon);
    $$('.hotline-ph-note').forEach(function (el) { el.classList.toggle('hidden', !s.hotlineIsPlaceholder); });
    if (!s.hotlineIsPlaceholder && s.hotline) { var tel = 'tel:' + s.hotline.replace(/[^\d+]/g, ''); $('#heroCall').href = tel; $('#barCall').href = tel; }
    if (s.lineQr) { $('#lineQrImg').src = safeUrl(s.lineQr); $('#lineQrImg').classList.remove('hidden'); $('#lineQrPh').classList.add('hidden'); }

    var r = c.royal || {};
    $('#royal').classList.toggle('hidden', r.enabled === false);
    $('#royalRibbon').classList.toggle('hidden', r.enabled === false);

    $('#servicesGrid').innerHTML = (c.services || []).map(function (x, i) {
      return '<a href="' + esc(safeUrl(x.link)) + '" class="reveal group relative rounded-3xl bg-white p-5 sm:p-7 shadow-card ring-1 ring-slate-100 hover:shadow-lift hover:-translate-y-1 transition duration-300 overflow-hidden" style="--d:' + (i * 60) + 'ms">' +
        '<span class="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gold-500/0 group-hover:bg-gold-500/10 transition"></span>' +
        '<span class="relative inline-flex w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ' + (i === 0 ? 'bg-gold-500 text-navy-950' : 'bg-navy-900 text-gold-400') + ' items-center justify-center group-hover:scale-110 transition">' + icon(x.icon, 'w-6 h-6 sm:w-7 sm:h-7') + '</span>' +
        '<h3 class="relative mt-4 sm:mt-5 font-head font-semibold text-navy-900 text-base sm:text-xl leading-snug">' + esc(x.title) + '</h3>' +
        '<p class="relative mt-1.5 text-sm sm:text-base text-slate-500 leading-relaxed">' + esc(x.desc) + '</p>' +
        '<span class="relative mt-4 hidden sm:inline-flex items-center gap-1 text-sm font-head font-semibold text-navy-800 group-hover:text-gold-700 transition">เข้าสู่บริการ ' + icon('arrow', 'w-4 h-4') + '</span></a>';
    }).join('');

    var t = c.tourist || {};
    $('#touristLangs').innerHTML = (t.languages || []).map(function (l) { return '<span class="rounded-full bg-navy-950/90 text-gold-300 text-xs font-head font-semibold px-3 py-1.5">' + esc(l) + '</span>'; }).join('');
    $('#touristTips').innerHTML = (t.tips || []).map(function (x, i) {
      return '<div class="reveal rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 hover:bg-white/10 transition" style="--d:' + (i * 70) + 'ms"><div class="flex items-center gap-3"><span class="w-10 h-10 rounded-xl bg-sea-500/20 text-sea-300 flex items-center justify-center shrink-0">' + icon(x.icon, 'w-5 h-5') + '</span><div><p class="font-head font-semibold leading-tight">' + esc(x.title) + '</p><p class="text-xs text-sea-300">' + esc(x.titleEn) + '</p></div></div><p class="mt-3 text-sm text-white/65 leading-relaxed">' + esc(x.desc) + '</p></div>';
    }).join('');
    var zones = t.zones || [];
    $('#zonePins').innerHTML = zones.map(function (z, i) {
      return '<button type="button" data-zone="' + i + '" class="zone-pin absolute -translate-x-1/2 -translate-y-full flex flex-col items-center" style="left:' + (+z.x || 50) + '%;top:' + (+z.y || 50) + '%" aria-label="' + esc(z.nameEn + ' ' + z.name) + '">' +
        '<span class="mb-1 whitespace-nowrap rounded-full bg-white text-navy-900 text-[11px] sm:text-xs font-head font-semibold px-2.5 py-1 shadow-lg">' + esc(z.nameEn) + '</span>' +
        '<span class="pin-dot relative w-5 h-5 rounded-full bg-gold-500 ring-4 ring-gold-500/30 transition ' + (i === 0 ? 'pin-pulse' : '') + '"></span></button>';
    }).join('');
    $('#zoneList').innerHTML = zones.map(function (z, i) {
      return '<button type="button" data-zone="' + i + '" class="zone-item text-left rounded-2xl px-4 py-3 ring-1 ring-white/10 hover:bg-white/10 transition flex gap-3 items-start ' + (i === 0 ? 'bg-white/10' : '') + '"><span class="mt-1.5 w-2.5 h-2.5 rounded-full bg-gold-500 shrink-0"></span><span><span class="font-head font-semibold">' + esc(z.nameEn) + ' · ' + esc(z.name) + '</span><span class="block text-sm text-white/60">' + esc(z.desc) + '</span></span></button>';
    }).join('');
    $$('[data-zone]').forEach(function (b) { b.addEventListener('click', function () { selectZone(+b.getAttribute('data-zone')); }); });

    var st = c.stats || {};
    $('#statsBadge').classList.toggle('hidden', !st.isExample);
    $('#stats').innerHTML = (st.items || []).map(function (x, i) {
      return '<div class="reveal rounded-2xl glass p-5 sm:p-6" style="--d:' + (i * 80) + 'ms"><div class="font-head font-extrabold text-3xl sm:text-5xl text-gold-400 whitespace-nowrap"><span class="counter" data-target="' + (+x.value || 0) + '">0</span>' + esc(x.suffix) + '</div><p class="mt-2 text-white/75 text-sm sm:text-base">' + esc(x.label) + '</p></div>';
    }).join('');

    var arts = [
      '<svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="200" fill="#0EA0F5"/><path fill="#0B2545" fill-opacity=".35" d="M0 130 C100 100 200 160 300 125 S 400 110 400 110V200H0z"/><path fill="#FBE38A" fill-opacity=".55" d="M0 165 C120 145 260 190 400 155V200H0z"/><circle cx="320" cy="55" r="26" fill="#FBE38A"/></svg>',
      '<svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="200" fill="#0B2545"/><path fill="#13315C" d="M0 200V120h30V90h40v30h20V70h50v50h30V100h40v20h30V60h40v60h30V95h40v25h50v80z"/><g fill="#F8D347"><rect x="105" y="82" width="7" height="7"/><rect x="122" y="82" width="7" height="7"/><rect x="265" y="72" width="7" height="7"/><rect x="265" y="90" width="7" height="7"/><rect x="45" y="100" width="7" height="7"/></g></svg>',
      '<svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="200" fill="#F5C518"/><g fill="#0B2545" fill-opacity=".15"><circle cx="80" cy="150" r="70"/><circle cx="330" cy="40" r="90"/></g><path d="M0 150 C 100 130 200 170 400 140" stroke="#fff" stroke-opacity=".6" stroke-width="5" fill="none"/></svg>'
    ];
    $('#newsGrid').innerHTML = (c.news || []).slice(0, 6).map(function (n, i) {
      var media = n.image ? '<img src="' + esc(safeUrl(n.image)) + '" alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700">' : arts[i % 3];
      return '<article class="reveal group rounded-3xl bg-white shadow-card ring-1 ring-slate-100 hover:shadow-lift transition overflow-hidden flex flex-col" style="--d:' + (i * 90) + 'ms">' +
        '<div class="relative h-48 overflow-hidden">' + media + '<span class="absolute top-3 left-3 text-xs font-semibold rounded-full bg-white/95 text-navy-900 px-3 py-1">' + esc(n.category) + '</span>' + exBadge(n.isExample, 'absolute top-3 right-3') + '</div>' +
        '<div class="p-6 flex-1 flex flex-col"><time class="text-sm text-slate-500" datetime="' + esc(n.date) + '">' + esc(fmtDate(n.date)) + '</time>' +
        '<h3 class="mt-2 font-head font-semibold text-xl text-navy-900 leading-snug group-hover:text-gold-700 transition">' + esc(n.title) + '</h3>' +
        '<p class="mt-2 text-slate-600 leading-relaxed flex-1">' + esc(n.excerpt) + '</p>' +
        '<span class="mt-4 font-head font-semibold text-navy-800 inline-flex items-center gap-1">อ่านต่อ ' + icon('arrow', 'w-4 h-4') + '</span></div></article>';
    }).join('');

    renderLaws(c.laws || {});
    $('#faqList').innerHTML = (c.faq || []).map(function (f) {
      return '<details class="rounded-2xl bg-white ring-1 ring-slate-200 open:ring-gold-500/60 open:bg-gold-100/30 transition"><summary class="cursor-pointer px-5 py-4 flex items-center justify-between gap-3 font-head font-medium text-navy-900">' + esc(f.q) + '<span class="faq-icon text-2xl leading-none text-gold-600 transition">+</span></summary><p class="px-5 pb-5 -mt-1 text-slate-600 leading-relaxed break-words">' + linkify(f.a) + '</p></details>';
    }).join('');

    $('#cCat').innerHTML = '<option value="">— เลือกประเภทเรื่อง —</option>' + (c.complaintCategories || []).map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    $('#footerLinks').innerHTML = ((c.footer || {}).links || []).map(function (l) { return '<li><a class="hover:text-gold-400 transition" href="' + esc(safeUrl(l.href)) + '">' + esc(l.label) + '</a></li>'; }).join('');

    applyLayout(c);
    if (window.TKPAlerts) window.TKPAlerts.init(c.alerts || {});
    if (window.TKPCCTV) window.TKPCCTV.init(c.cctv || {});
    if (window.TKPTraffic) window.TKPTraffic.init(c.traffic || {}, c.alerts || {});
    initChat(c.chatbot || {});
    paintIcons(document);
    observeReveal(document);
    observeCounters();
  }

  function selectZone(i) {
    $$('.zone-item').forEach(function (b, j) { b.classList.toggle('bg-white/10', j === i); });
    $$('.pin-dot').forEach(function (p, j) { p.classList.toggle('pin-pulse', j === i); p.classList.toggle('scale-125', j === i); });
  }

  var countersDone = false;
  function runCounters() {
    if (countersDone) return; countersDone = true;
    $$('.counter').forEach(function (c) {
      var target = +c.dataset.target, start = null;
      function step(ts) { if (start === null) start = ts; var p = Math.min((ts - start) / 1600, 1); c.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('th-TH'); if (p < 1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }
  function observeCounters() {
    if (!('IntersectionObserver' in window)) return runCounters();
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { runCounters(); o.disconnect(); } }); }, { threshold: .3 });
    o.observe($('#stats'));
  }
  window.__runCounters = runCounters;

  // ---------- header / menu / lang ----------
  var menu = $('#mobileMenu'), mBtn = $('#menuBtn');
  function setMenu(open) { menu.classList.toggle('hidden', !open); mBtn.setAttribute('aria-expanded', open); mBtn.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู'); $('#iconOpen').classList.toggle('hidden', open); $('#iconClose').classList.toggle('hidden', !open); }
  mBtn.addEventListener('click', function () { setMenu(menu.classList.contains('hidden')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  window.addEventListener('scroll', function () { $('#siteHeader').classList.toggle('shadow-lift', window.scrollY > 20); }, { passive: true });
  var langMenu = $('#langMenu'), langBtn = $('#langBtn');
  langBtn.addEventListener('click', function (e) { e.stopPropagation(); var hidden = langMenu.classList.toggle('hidden'); langBtn.setAttribute('aria-expanded', String(!hidden)); });
  document.addEventListener('click', function () { langMenu.classList.add('hidden'); langBtn.setAttribute('aria-expanded', 'false'); });
  var langMsg = { en: ['English', 'The assistant “น้องAI” now replies in English. Full English pages coming soon.'], zh: ['中文', '智能助手现在用中文回答。中文网页即将推出。'], ru: ['Русский', 'Помощник теперь отвечает по-русски. Русская версия сайта скоро появится.'], th: ['ภาษาไทย', 'น้องAIตอบเป็นภาษาไทย'] };
  function setLang(l, silent) {
    if (!LANG_UI[l]) return; curLang = l; $('#langCur').textContent = LANG_UI[l];
    try { localStorage.setItem('tkpLang', l); } catch (e) {}
    $$('.lang-opt').forEach(function (b) { b.setAttribute('aria-selected', String(LANG_KEYS[b.dataset.lang] === l)); });
    if (!silent && langMsg[l]) toast(langMsg[l][0], esc(langMsg[l][1]));
    document.dispatchEvent(new CustomEvent('tkp:lang', { detail: l }));
  }
  $$('.lang-opt').forEach(function (b) { b.addEventListener('click', function () { setLang(LANG_KEYS[b.dataset.lang]); }); });
  setLang(curLang, true);

  // ---------- tracker ----------
  var STEPS = [['received', 'รับเรื่อง'], ['in_progress', 'กำลังดำเนินการ'], ['done', 'เสร็จสิ้น']];
  function fmtDT(iso) { try { return new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  function showTrack(data, isDemo) {
    var idx = STEPS.findIndex(function (s) { return s[0] === data.status; });
    var at = {}; (data.history || []).forEach(function (h) { at[h.status] = h.at; });
    var last = (data.history || []).slice(-1)[0] || {};
    $('#trackResult').innerHTML =
      '<div class="flex flex-wrap items-center justify-between gap-2"><p class="font-head font-semibold text-navy-900">เลขรับเรื่อง: <span class="text-gold-700">' + esc(data.id) + '</span></p>' + (isDemo ? '<span class="text-xs font-semibold rounded-full bg-amber-100 text-amber-800 px-3 py-1">ตัวอย่างการแสดงผล</span>' : '') + '</div>' +
      '<ol class="mt-7 relative grid grid-cols-3 gap-2"><div class="absolute top-5 left-[16.6%] right-[16.6%] h-1 bg-slate-200 rounded"></div><div class="absolute top-5 left-[16.6%] h-1 bg-gold-500 rounded transition-all duration-700" style="width:' + (Math.max(idx, 0) * 33.4) + '%"></div>' +
      STEPS.map(function (s, i) {
        var doneStep = i < idx || (i === idx && s[0] === 'done');
        var cls = doneStep ? 'bg-navy-900 text-white' : i === idx ? 'bg-gold-500 text-navy-950' : 'bg-slate-200 text-slate-500';
        return '<li class="relative flex flex-col items-center text-center"><span class="w-11 h-11 rounded-full ' + cls + ' flex items-center justify-center font-head font-bold ring-4 ring-white">' + (doneStep ? icon('check', 'w-5 h-5') : i + 1) + '</span><span class="mt-2 font-head font-semibold text-navy-900 text-sm sm:text-base">' + s[1] + '</span><span class="text-xs text-slate-500">' + (at[s[0]] ? esc(fmtDT(at[s[0]])) : 'รอดำเนินการ') + '</span></li>';
      }).join('') + '</ol>' +
      '<div class="mt-6 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 text-sm leading-relaxed"><p><span class="font-semibold text-navy-900">หมวดหมู่:</span> ' + esc(data.category) + '</p><p><span class="font-semibold text-navy-900">สถานะล่าสุด:</span> ' + esc(last.note || data.statusLabel || '') + '</p></div>';
    $('#trackResult').classList.remove('hidden');
    $('#trackResult').querySelector('ol').classList.add('max-w-xl', 'mx-auto', 'w-full');
  }
  var DEMO = { id: 'TKP-2569-00123', category: 'สิ่งกีดขวางทางเท้า', status: 'in_progress', history: [{ status: 'received', at: '2026-10-12T02:15:00Z', note: 'ระบบรับเรื่องเรียบร้อย' }, { status: 'in_progress', at: '2026-10-13T07:30:00Z', note: 'เจ้าหน้าที่ลงพื้นที่ตรวจสอบแล้ว อยู่ระหว่างประสานผู้ประกอบการ' }] };
  function track(id) {
    id = (id || '').trim().toUpperCase();
    if (!id) return;
    if (id === DEMO.id) return showTrack(DEMO, true);
    fetch('/api/track/' + encodeURIComponent(id)).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (x.ok) return showTrack(x.j, false);
        $('#trackResult').innerHTML = '<div class="rounded-2xl bg-red-50 text-red-700 ring-1 ring-red-200 p-4">ไม่พบเลขรับเรื่อง <b>' + esc(id) + '</b> กรุณาตรวจสอบอีกครั้ง</div>'; $('#trackResult').classList.remove('hidden');
      }).catch(function () { showTrack(Object.assign({}, DEMO, { id: id }), true); });
  }
  window.__track = track;
  $('#trackForm').addEventListener('submit', function (e) { e.preventDefault(); track($('#trackInput').value); });
  $('#demoTrack').addEventListener('click', function () { $('#trackInput').value = DEMO.id; track(DEMO.id); });

  // ---------- complaint (compact sheet) ----------
  var modal = $('#cModal'), sheet = $('#cSheet'), lastFocus = null;
  function openComplaint(open) {
    if (open) {
      lastFocus = document.activeElement;
      $('#complaintForm').classList.remove('hidden'); $('#cDone').classList.add('hidden');
      modal.classList.remove('hidden'); document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { $('#cBackdrop').classList.remove('opacity-0'); sheet.classList.remove('translate-y-full', 'sm:translate-y-[-40%]', 'opacity-0'); sheet.classList.add('sm:-translate-y-1/2'); });
      setTimeout(function () { $('#cCat').focus({ preventScroll: true }); }, 320);
      if (window.innerWidth < 640 && window.__openChat) window.__openChat(false);
    } else {
      $('#cBackdrop').classList.add('opacity-0'); sheet.classList.add('translate-y-full', 'sm:translate-y-[-40%]', 'opacity-0'); sheet.classList.remove('sm:-translate-y-1/2');
      setTimeout(function () { modal.classList.add('hidden'); document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }, 300);
    }
  }
  window.__openComplaint = openComplaint;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#complaint"], [data-open-complaint]');
    if (a) { e.preventDefault(); openComplaint(true); return; }
    if (e.target.closest && e.target.closest('[data-close-complaint]')) openComplaint(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.classList.contains('hidden')) openComplaint(false); });
  $('#cDesc').addEventListener('input', function () { $('#cDescCount').textContent = this.value.length + '/500'; });
  $('#cPhoto').addEventListener('change', function () {
    var f = this.files[0]; $('#photoLabel').textContent = f ? f.name : 'แนบรูป (ถ้ามี)';
    var pv = $('#photoPreview'), ic = $('#photoIcon') || $('label[for=cPhoto] svg');
    if (f && /^image\//.test(f.type)) { pv.src = URL.createObjectURL(f); pv.classList.remove('hidden'); if (ic) ic.classList.add('hidden'); } else { pv.classList.add('hidden'); if (ic) ic.classList.remove('hidden'); }
  });
  $('#locBtn').addEventListener('click', function () {
    if (!navigator.geolocation) return toast('ไม่รองรับ', 'อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง');
    $('#locLabel').textContent = 'กำลังระบุ…';
    navigator.geolocation.getCurrentPosition(function (p) { $('#cLoc').value = p.coords.latitude.toFixed(6) + ', ' + p.coords.longitude.toFixed(6); $('#locLabel').textContent = 'ระบุตำแหน่งแล้ว ✓'; },
      function () { $('#locLabel').textContent = 'ใช้ตำแหน่งปัจจุบัน'; toast('ระบุตำแหน่งไม่ได้', 'กรุณาพิมพ์ตำแหน่งด้วยตนเอง'); }, { timeout: 8000 });
  });
  $('#complaintForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = this, ok = true;
    ['cCat', 'cDesc', 'cPhone'].forEach(function (id) { var el = $('#' + id), bad = !el.value.trim(); el.classList.toggle('border-red-400', bad); el.classList.toggle('border-slate-300', !bad); el.setAttribute('aria-invalid', bad); if (bad) ok = false; });
    if (!$('#cConsent').checked) { ok = false; $('#cConsent').focus(); }
    if (!ok) return toast('กรุณากรอกข้อมูลให้ครบ', 'ประเภท รายละเอียด เบอร์โทร และการยินยอม จำเป็นต้องกรอก');
    var btn = $('#cSubmit'); btn.disabled = true; btn.textContent = 'กำลังส่ง…';
    fetch('/api/complaints', { method: 'POST', body: new FormData(form) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'error'); return j; }); })
      .then(function (j) {
        $('#cDoneId').textContent = j.id; $('#trackInput').value = j.id;
        form.reset(); $('#cDescCount').textContent = '0/500'; $('#photoPreview').classList.add('hidden'); $('#photoLabel').textContent = 'แนบรูป (ถ้ามี)'; $('#locLabel').textContent = 'ใช้ตำแหน่งปัจจุบัน';
        form.classList.add('hidden'); $('#cDone').classList.remove('hidden');
      })
      .catch(function (err) { toast('ส่งเรื่องไม่สำเร็จ', esc(err.message === 'Failed to fetch' ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' : err.message)); })
      .then(function () { btn.disabled = false; btn.textContent = 'ส่งเรื่อง'; });
  });
  $('#cCopy').addEventListener('click', function () { var t = $('#cDoneId').textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('คัดลอกแล้ว', esc(t)); }, function () {}); });
  $('#cGoTrack').addEventListener('click', function () { openComplaint(false); track($('#cDoneId').textContent); setTimeout(function () { $('#track').scrollIntoView({ behavior: 'smooth' }); }, 320); });

  // ---------- chatbot (มาสคอต + หลายภาษา) ----------
  var chatReady = false, history = [], bot = {}, userSpoke = false, greetEl = null, logoUrl = 'assets/logo.png';
  var CUI = {
    th: { ph: 'พิมพ์คำถาม…', hint: 'ถามน้องAIได้เลย!', typing: 'กำลังพิมพ์', off: 'ขออภัยครับ ขณะนี้ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง', sub: 'ออนไลน์ · ตอบจากแหล่งข้อมูลทางราชการ', dis: '', hi: 'สวัสดีครับ ผมน้องAIเทศกิจพัทยา' },
    en: { ph: 'Type your question…', hint: 'Ask me anything!', typing: 'typing', off: 'Sorry, the assistant is offline right now. Please try again.', sub: 'Online · answers from official sources', dis: 'Answers only from this website and official sources · Emergency 191 / 1155 / 1669', hi: 'Hi, I’m your Pattaya City helper' },
    zh: { ph: '请输入您的问题…', hint: '有问题问我吧！', typing: '正在输入', off: '抱歉，助手暂时无法连接，请稍后再试。', sub: '在线 · 依据官方来源回答', dis: '仅根据本网站及官方来源回答 · 紧急情况拨打 191 / 1155 / 1669', hi: '您好，我是芭提雅市执法小助手' },
    ru: { ph: 'Введите вопрос…', hint: 'Спросите меня!', typing: 'печатает', off: 'Извините, помощник сейчас недоступен. Попробуйте позже.', sub: 'Онлайн · ответы по официальным источникам', dis: 'Ответы только по данным сайта и официальным источникам · Экстренно 191 / 1155 / 1669', hi: 'Привет! Я помощник инспекции Паттайи' }
  };
  function useMascot() { return bot.mascot !== false; }
  function avatarHtml(cls) {
    return useMascot() ? window.TKPMascot.svg(logoUrl, cls) : '<img src="' + esc(safeUrl(bot.avatar || logoUrl)) + '" alt="" class="w-full h-full object-contain rounded-full bg-gradient-to-br from-gold-300 to-gold-500 p-1">';
  }
  // อวาตาร์ในบับเบิลแชท: ภาพนิ่ง assets/mascot.png (เบา) · ถ้าปิดมาสคอตใช้รูปที่อัปโหลดเอง/โลโก้
  function bubbleAvatar() {
    if (!useMascot()) return '<span class="w-9 h-9 shrink-0">' + avatarHtml('static') + '</span>';
    return '<span class="w-9 h-9 shrink-0 rounded-full ring-2 ring-cyan-300/70 shadow-sm" role="img" aria-label="" style="background:url(' + esc((window.TKPMascot && window.TKPMascot.png) || 'assets/mascot.png') + ') 50% -3px/140% auto no-repeat,linear-gradient(#f0f9ff,#cffafe)"></span>';
  }
  function figs() { return $$('#chatFabFig .mascot, #chatHeadFig .mascot, #chatHeroFig .mascot'); }
  function talk(on) { figs().forEach(function (m) { m.classList.toggle('talking', !!on); }); }
  function wave() { figs().forEach(function (m) { m.classList.remove('wave'); void m.getBoundingClientRect(); m.classList.add('wave'); setTimeout(function () { m.classList.remove('wave'); }, 2100); }); }
  function L(k) { return (CUI[curLang] || CUI.th)[k]; }
  function greeting() { var g = bot.greetings || {}; return g[curLang] || (curLang === 'th' ? bot.greeting : g.en) || bot.greeting || 'สวัสดีครับ'; }
  function chips() { var q = bot.quickRepliesI18n || {}; return q[curLang] || (curLang === 'th' ? bot.quickReplies : q.en) || bot.quickReplies || []; }
  function paintChat() {
    $('#chatInput').placeholder = L('ph'); $('#chatHintText').textContent = L('hint');
    $('#chatSub').textContent = L('sub');
    $('#chatDisclaimer').textContent = L('dis') || bot.disclaimer || '';
    var hh = $('#chatHeroHi'); if (hh) hh.textContent = L('hi');
    $('#chatChips').innerHTML = chips().map(function (q) { return '<button type="button" class="chat-chip shrink-0 rounded-full border border-navy-800/20 bg-white text-navy-900 text-sm font-head px-3.5 py-1.5 hover:bg-gold-100 hover:border-gold-500 transition">' + esc(q) + '</button>'; }).join('');
    $$('.chat-chip').forEach(function (c) { c.addEventListener('click', function () { send(c.textContent); }); });
    if (greetEl && !userSpoke) { greetEl.remove(); greetEl = addMsg('bot', greeting()); }
  }
  function initChat(b) {
    bot = b || {};
    if (bot.enabled === false) return;
    logoUrl = safeUrl(((window.__content || {}).site || {}).logo || 'assets/logo.png');
    $('#chatRoot').classList.remove('hidden');
    $$('.bot-name').forEach(function (el) { el.textContent = bot.name || 'น้องAI'; });
    $('#chatFabFig').innerHTML = avatarHtml('');
    $('#chatHeadFig').innerHTML = avatarHtml('');
    $('#chatDisclaimer').textContent = bot.disclaimer || '';
    if (!chatReady) {
      if (useMascot()) {
        var hero = document.createElement('div');
        hero.className = 'flex flex-col items-center text-center pt-1 pb-2';
        hero.innerHTML = '<span id="chatHeroFig" class="block w-32 h-36" style="background:radial-gradient(circle at 50% 58%,rgba(103,232,249,.35) 0,rgba(186,230,253,.25) 38%,transparent 66%)">' + window.TKPMascot.svg(logoUrl, '') + '</span><p class="mt-1 font-head font-semibold text-navy-900 bot-name">' + esc(bot.name || 'น้องAI') + '</p><p id="chatHeroHi" class="text-xs text-slate-500"></p>';
        $('#chatLog').appendChild(hero);
      }
      greetEl = addMsg('bot', greeting()); chatReady = true;
    }
    paintChat();
    setTimeout(function () { var h = $('#chatHint'); if (h) h.classList.add('sm:hidden'); }, 9000);
  }
  document.addEventListener('tkp:lang', function () { if (chatReady) paintChat(); });
  function addMsg(who, text) {
    var wrap = document.createElement('div');
    wrap.className = who === 'user' ? 'flex justify-end' : 'flex gap-2 items-end';
    wrap.innerHTML = who === 'user'
      ? '<div class="max-w-[82%] rounded-2xl rounded-br-md bg-navy-900 text-white px-4 py-2.5 text-[15px] leading-relaxed">' + esc(text).replace(/\n/g, '<br>') + '</div>'
      : bubbleAvatar() + '<div class="max-w-[84%] min-w-0 rounded-2xl rounded-bl-md bg-white ring-1 ring-slate-200 text-slate-800 px-4 py-2.5 text-[15px] leading-relaxed shadow-sm break-words">' + linkify(text) + '</div>';
    $('#chatLog').appendChild(wrap); $('#chatLog').scrollTop = 1e9;
    $$('.chat-link', wrap).forEach(function (a) { a.addEventListener('click', function () { if (window.innerWidth < 640) openChat(false); }); });
    return wrap;
  }
  function send(text) {
    text = String(text || '').trim(); if (!text) return;
    userSpoke = true;
    addMsg('user', text); $('#chatInput').value = '';
    var typing = document.createElement('div'); typing.className = 'flex gap-2 items-end';
    typing.innerHTML = '<span class="w-9 h-10 shrink-0 -mb-1">' + avatarHtml('static talking') + '</span><div class="rounded-2xl rounded-bl-md bg-white ring-1 ring-slate-200 px-4 py-3.5 typing flex gap-1" aria-label="' + esc(L('typing')) + '"><span></span><span></span><span></span></div>';
    $('#chatLog').appendChild(typing); $('#chatLog').scrollTop = 1e9;
    talk(true);
    var started = Date.now();
    fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history: history.slice(-10), lang: curLang }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { return j.reply || j.error || '…'; })
      .catch(function () { return L('off'); })
      .then(function (reply) {
        setTimeout(function () {
          typing.remove(); addMsg('bot', reply); history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
          setTimeout(function () { talk(false); }, Math.min(2600, 500 + reply.length * 12));
        }, Math.max(0, 900 - (Date.now() - started)));
      });
  }
  function openChat(open) {
    var small = window.innerWidth < 640;
    $('#chatPanel').classList.toggle('closed', !open); $('#chatFab').setAttribute('aria-expanded', String(open));
    $('#chatFab').classList.toggle('opacity-0', open && small); $('#chatFab').classList.toggle('pointer-events-none', open && small);
    var h = $('#chatHint'); if (h && open) h.classList.add('sm:hidden');
    if (open) setTimeout(wave, 120);
    if (open && !small) setTimeout(function () { $('#chatInput').focus({ preventScroll: true }); }, 200);
  }
  window.__openChat = openChat; window.__chatSend = send;
  $('#chatFab').addEventListener('click', function () { openChat($('#chatPanel').classList.contains('closed')); });
  $('#chatClose').addEventListener('click', function () { openChat(false); });
  $('#chatForm').addEventListener('submit', function (e) { e.preventDefault(); send($('#chatInput').value); });
  $('#chatInput').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(this.value); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openChat(false); });

  // ---------- boot ----------
  paintIcons(document);
  fetch('/api/content').then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .catch(function () { return fetch('data/content.json').then(function (r) { return r.json(); }); })
    .then(function (c) { window.__content = c; render(c); })
    .catch(function () { observeReveal(document); console.warn('content.json not available — run `npm start` and open http://localhost:3000'); });
})();
