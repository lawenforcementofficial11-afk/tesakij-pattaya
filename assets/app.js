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
  // above-the-fold hero: reveal right away so it never sits blank on slow devices
  $$('#home .reveal').forEach(function (el) { el.classList.add('is-in'); });

  function fmtDate(iso) { try { return new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return iso; } }
  var exBadge = function (on, cls) { return on ? '<span class="' + (cls || '') + ' text-[11px] font-semibold rounded-full bg-amber-100 text-amber-800 px-2.5 py-1">เนื้อหาตัวอย่าง</span>' : ''; };


  // ---------- linkify (URL ทางการ + #section) ----------
  function shortUrl(u) { try { var x = new URL(u.replace(/&amp;/g, '&')); return x.hostname.replace(/^www\./, '') + (x.pathname.length > 1 ? '/…' : ''); } catch (e) { return u; } }
  function linkify(t) {
    return esc(t)
      .replace(/https?:\/\/[^\s<>"',]+[^\s<>"',.)]/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener" class="chat-ext underline decoration-sea-500 decoration-2 underline-offset-2 text-navy-800 font-semibold break-all">🔗 ' + esc(shortUrl(u)) + '</a>'; })
      .replace(/(^|[\s(])(#(?:complaint|track|laws|contact|news|faq|services))\b/g, '$1<a href="$2" class="chat-link underline decoration-gold-500 decoration-2 underline-offset-2 font-semibold">$2</a>')
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
        list.map(function (l, li) {
          var has = l.fineAmount != null && l.fineAmount !== '';
          var links = [l.url, l.url2].filter(Boolean).map(function (u, i) { return '<a href="' + esc(safeUrl(u)) + '" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-navy-800 hover:text-gold-700 underline decoration-gold-500/60 underline-offset-2">' + (i ? 'ตัวบท/สำเนา' : 'แหล่งที่มาทางการ') + ' · ' + esc(shortUrl(u)) + ' ↗</a>'; }).join('<span class="text-slate-300">|</span>');
          return '<li class="' + (li >= 2 ? 'law-more hidden ' : '') + 'px-5 sm:px-6 py-4 grid sm:grid-cols-[1fr_auto] gap-x-6 gap-y-2"><div class="min-w-0"><p class="font-head font-semibold text-navy-900 leading-snug">' + esc(l.title) + '</p>' +
            (l.summary ? '<p class="mt-1 text-sm text-slate-600 leading-relaxed">' + esc(l.summary) + '</p>' : '') +
            '<p class="mt-1.5 text-xs text-slate-500">📜 ' + esc(l.legalRef || l.ref || '') + (l.year ? ' · ปีที่มีผล/ประกาศ พ.ศ. ' + esc(l.year) : '') + '</p>' +
            (links ? '<p class="mt-1.5 text-xs flex flex-wrap gap-x-2 gap-y-1">' + links + '</p>' : '') + '</div>' +
            '<div class="sm:text-right"><span class="inline-block rounded-full ' + (has ? 'bg-navy-900 text-gold-300' : 'bg-slate-100 text-slate-600') + ' text-xs sm:text-sm font-head font-semibold px-3 py-1.5 whitespace-nowrap">' + (has ? 'ปรับ' : '') + esc(l.fine) + '</span>' + (has ? '<p class="mt-1 text-[11px] text-slate-400">อัตราสูงสุดตามตัวบท</p>' : '') + '</div></li>';
        }).join('') + '</ul>' + (list.length > 2 ? '<button type="button" class="law-toggle w-full border-t border-slate-100 px-5 py-3 text-sm font-head font-semibold text-navy-800 hover:bg-gold-100/40 hover:text-gold-700 transition" data-n="' + (list.length - 2) + '">ดูอีก ' + (list.length - 2) + ' รายการ ▾</button>' : '') + '</div>';
    }).join('');
    function expand(g, on) { $$('.law-more', g).forEach(function (li) { li.classList.toggle('hidden', !on); }); var t = $('.law-toggle', g); if (t) t.textContent = on ? 'ย่อรายการ ▴' : 'ดูอีก ' + t.dataset.n + ' รายการ ▾'; g.dataset.open = on ? '1' : ''; }
    $$('.law-toggle').forEach(function (t) { t.addEventListener('click', function () { var g = t.closest('.law-group'); expand(g, !g.dataset.open); }); });
    $('#lawSources').innerHTML = (L.sources || []).map(function (x) { return '<li class="flex gap-2"><span class="text-gold-600">•</span><a class="text-navy-800 hover:text-gold-700 underline decoration-gold-500/50 underline-offset-2" target="_blank" rel="noopener" href="' + esc(safeUrl(x.url)) + '">' + esc(x.name) + ' ↗</a></li>'; }).join('');
    $$('.law-cat').forEach(function (b) { b.addEventListener('click', function () {
      var k = b.dataset.lawcat;
      $$('.law-cat').forEach(function (x) { var on = x === b; x.classList.toggle('bg-navy-900', on); x.classList.toggle('text-white', on); x.classList.toggle('ring-navy-900', on); x.classList.toggle('bg-white', !on); x.classList.toggle('text-navy-900', !on); });
      $$('.law-group').forEach(function (g) { g.classList.toggle('hidden', !!k && g.dataset.cat !== k); expand(g, !!k && g.dataset.cat === k); });
    }); });
  }

  // ---------- section layout (admin: เปิด/ปิด + ลากเรียงลำดับ) ----------
  var SEC_LINK = { complaint: 'complaint', track: 'trackStatus', about: 'about', news: 'news', laws: 'laws', faq: 'faq', royal: 'royal', services: 'services' };
  function applyLayout(c) {
    var f = c.features || {}, secs = (c.sections || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var on = {}; secs.forEach(function (x) { on[x.id] = x.enabled !== false; });
    var main = $('#main') || $('main');
    // reorder (hero stays first because it sits under the transparent header)
    secs.forEach(function (x) { var el = $('[data-sec="' + x.id + '"]'); if (el && x.id !== 'hero' && x.id !== 'royal') main.appendChild(el); });
    $$('[data-sec]').forEach(function (el) { var id = el.dataset.sec; if (id in on && !on[id]) { el.classList.add('hidden'); el.setAttribute('data-off', '1'); } });
    $$('[data-feat]').forEach(function (el) { if (f[el.dataset.feat] === false) { el.classList.add('hidden'); el.setAttribute('data-off', '1'); } });
    if (!on.hero) document.body.classList.add('no-hero');
    if (f.heroMascot === false || f.chatbot === false || (c.chatbot || {}).enabled === false) { var hg = $('#heroGrid'); if (hg) hg.classList.add('no-bot'); var hb0 = $('#heroBot'); if (hb0) hb0.classList.add('hidden'); }
    if (f.chatbot === false) c.chatbot = Object.assign({}, c.chatbot, { enabled: false });
    // track section: if both cards are off, let the about text span the row
    if (f.complaint === false && f.trackStatus === false) { var tc = $('#trackCards'); if (tc) tc.classList.add('hidden'); }
    if (f.about === false) { var tc2 = $('#trackCards'); if (tc2) tc2.classList.replace('lg:col-span-3', 'lg:col-span-5'); }
    if (on.track === false) { f = Object.assign({}, f, { complaint: false, trackStatus: false, about: false }); }
    // hide nav links to things that are off
    var off = { news: !on.news, laws: !on.laws, faq: !on.faq, royal: !on.royal, services: !on.services, complaint: f.complaint === false, track: f.trackStatus === false, about: f.about === false, chat: f.chatbot === false };
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
    if (s.lineQr) { $('#lineQrImg').src = safeUrl(s.lineQr); $('#lineQrImg').classList.remove('hidden'); $('#lineQrBox').classList.remove('hidden'); }
    var srcLink = function (u) { return u ? ' <a href="' + esc(safeUrl(u)) + '" target="_blank" rel="noopener" class="src-link">ที่มา ↗</a>' : ''; };
    // ติดต่อ (ข้อมูลจริงพร้อมแหล่งที่มา)
    var cl = $('#footerContacts');
    if (cl) {
      var rows = (s.contacts || []).map(function (x) { return '<li class="flex gap-2.5"><span class="text-gold-400 shrink-0 mt-0.5">' + icon('phone', 'w-5 h-5') + '</span><span><span class="block text-white/60 text-xs">' + esc(x.label) + (x.note ? ' · ' + esc(x.note) : '') + '</span><a class="font-semibold text-white hover:text-gold-300" href="tel:' + esc(x.tel || x.value) + '">' + esc(x.value) + '</a>' + srcLink(x.source) + '</span></li>'; });
      if (s.address) rows.push('<li class="flex gap-2.5"><span class="text-gold-400 shrink-0 mt-0.5">' + icon('pin', 'w-5 h-5') + '</span><span>' + esc(s.address) + srcLink(s.addressSource) + (s.cityHallAddress ? '<span class="block mt-1 text-white/60">' + esc(s.cityHallAddress) + srcLink(s.cityHallSource) + '</span>' : '') + '</span></li>');
      if (s.email) rows.push('<li class="flex gap-2.5"><span class="text-gold-400 shrink-0 mt-0.5">' + icon('mail', 'w-5 h-5') + '</span><span>' + (s.emailLabel ? esc(s.emailLabel) + ': ' : '') + '<a class="hover:text-gold-300" href="mailto:' + esc(s.email) + '">' + esc(s.email) + '</a>' + srcLink(s.emailSource) + '</span></li>');
      if (s.hours) rows.push('<li class="flex gap-2.5"><span class="text-gold-400 shrink-0 mt-0.5">' + icon('clock', 'w-5 h-5') + '</span><span>' + esc(s.hours) + srcLink(s.hoursSource) + '</span></li>');
      cl.innerHTML = rows.join('');
    }
    var lb = $('#lineBtn'); if (lb) { if (s.lineUrl) lb.href = safeUrl(s.lineUrl); lb.classList.toggle('hidden', !s.lineId); }
    var fb = $('#fbBtn'); if (fb) { if (s.facebook) fb.href = safeUrl(s.facebook); fb.classList.toggle('hidden', !s.facebook); }
    var ls = $('#lineSrc'); if (ls) ls.innerHTML = srcLink(s.lineSource || s.facebookSource);
    // เกี่ยวกับเรา (ข้อความทางการ + แหล่งที่มา)
    var ab = c.about || {};
    if (ab.heading) $('#aboutHeading').textContent = ab.heading;
    if (ab.text) $('#aboutText').innerHTML = esc(ab.text) + srcLink(ab.source).replace('src-link', 'src-link src-dark');
    if (ab.bullets && ab.bullets.length) $('#aboutList').innerHTML = ab.bullets.map(function (b) { return '<li class="flex gap-3"><span class="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-gold-500/20 text-gold-700 flex items-center justify-center">' + icon('check', 'w-4 h-4') + '</span>' + esc(b) + '</li>'; }).join('');
    if (ab.org) $('#aboutOrg').innerHTML = '<span class="font-semibold text-navy-900">สังกัด:</span> ' + esc(ab.org) + (ab.orgSources || []).map(function (u) { return srcLink(u).replace('src-link', 'src-link src-dark'); }).join('');

    var r = c.royal || {};
    $('#royal').classList.toggle('hidden', r.enabled === false);

    var botOn = (c.features || {}).chatbot !== false && (c.chatbot || {}).enabled !== false;
    var mascotPng = (c.chatbot || {}).mascotStyle === 'robot' ? 'assets/mascot.png' : 'assets/mascot-officer.png';
    $('#servicesGrid').innerHTML = (c.services || []).filter(function (x) { return botOn || x.link !== '#chat'; }).map(function (x, i) {
      if (x.link === '#chat') {
        return '<a href="#chat" class="reveal group relative rounded-3xl bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 text-white p-5 sm:p-7 shadow-lift ring-1 ring-navy-800 hover:-translate-y-1 transition duration-300 overflow-hidden min-h-[180px]" style="--d:' + (i * 60) + 'ms">' +
          '<span class="absolute -right-10 -bottom-12 w-48 h-48 rounded-full bg-cyan-400/20 blur-2xl"></span>' +
          '<img src="' + mascotPng + '" alt="" class="absolute right-2 bottom-0 w-[104px] sm:w-[124px] drop-shadow-[0_12px_18px_rgba(0,0,0,.45)] group-hover:-translate-y-1 group-hover:rotate-[-3deg] transition duration-300">' +
          '<span class="relative inline-flex items-center gap-1.5 rounded-full bg-gold-500 text-navy-950 text-[11px] font-head font-bold px-2.5 py-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>AI · ออนไลน์</span>' +
          '<h3 class="relative mt-4 font-head font-semibold text-base sm:text-xl leading-snug pr-24 sm:pr-28">' + esc(x.title) + '</h3>' +
          '<p class="relative mt-1.5 text-sm sm:text-base text-white/70 leading-relaxed pr-24 sm:pr-28">' + esc(x.desc) + '</p>' +
          '<span class="relative mt-4 inline-flex items-center gap-1 text-sm font-head font-semibold text-gold-300">เริ่มคุยเลย ' + icon('arrow', 'w-4 h-4') + '</span></a>';
      }
      return '<a href="' + esc(safeUrl(x.link)) + '" class="reveal group relative rounded-3xl bg-white p-5 sm:p-7 shadow-card ring-1 ring-slate-100 hover:shadow-lift hover:-translate-y-1 transition duration-300 overflow-hidden min-h-[180px]" style="--d:' + (i * 60) + 'ms">' +
        '<span class="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gold-500/0 group-hover:bg-gold-500/10 transition"></span>' +
        '<span class="relative inline-flex w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ' + (i === 0 ? 'bg-gold-500 text-navy-950' : 'bg-navy-900 text-gold-400') + ' items-center justify-center group-hover:scale-110 transition">' + icon(x.icon, 'w-6 h-6 sm:w-7 sm:h-7') + '</span>' +
        '<h3 class="relative mt-4 sm:mt-5 font-head font-semibold text-navy-900 text-base sm:text-xl leading-snug">' + esc(x.title) + '</h3>' +
        '<p class="relative mt-1.5 text-sm sm:text-base text-slate-500 leading-relaxed">' + esc(x.desc) + '</p>' +
        '<span class="relative mt-4 inline-flex items-center gap-1 text-sm font-head font-semibold text-navy-800 group-hover:text-gold-700 transition">เข้าสู่บริการ ' + icon('arrow', 'w-4 h-4') + '</span></a>';
    }).join('');

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
      var media = n.image ? '<img src="' + esc(safeUrl(n.image)) + '" alt="' + esc(n.title) + '""" loading="lazy" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700">' : arts[i % 3];
      var tag = n.link ? 'a href="' + esc(safeUrl(n.link)) + '" target="_blank" rel="noopener"' : 'article';
      return '<' + tag + ' class="reveal group rounded-3xl bg-white shadow-card ring-1 ring-slate-100 hover:shadow-lift transition overflow-hidden flex flex-col" style="--d:' + (i * 90) + 'ms">' +
        '<div class="relative h-48 overflow-hidden">' + media + '<span class="absolute top-3 left-3 text-xs font-semibold rounded-full bg-white/95 text-navy-900 px-3 py-1">' + esc(n.category) + '</span>' + exBadge(n.isExample, 'absolute top-3 right-3') + '</div>' +
        '<div class="p-6 flex-1 flex flex-col"><time class="text-sm text-slate-500" datetime="' + esc(n.date) + '">' + esc(fmtDate(n.date)) + '</time>' +
        '<h3 class="mt-2 font-head font-semibold text-xl text-navy-900 leading-snug group-hover:text-gold-700 transition">' + esc(n.title) + '</h3>' +
        '<p class="mt-2 text-slate-600 leading-relaxed flex-1">' + esc(n.excerpt) + '</p>' +
        '<span class="mt-4 flex items-center justify-between gap-2"><span class="font-head font-semibold text-navy-800 inline-flex items-center gap-1 group-hover:text-gold-700">' + (n.link ? 'อ่านข่าวต้นฉบับ' : 'อ่านต่อ') + ' ' + icon('arrow', 'w-4 h-4') + '</span>' + (n.source ? '<span class="text-xs text-slate-400">ที่มา: ' + esc(n.source) + '</span>' : '') + '</span></div></' + (n.link ? 'a' : 'article') + '>';
    }).join('');

    renderLaws(c.laws || {});
    $('#faqList').innerHTML = (c.faq || []).map(function (f) {
      return '<details class="rounded-2xl bg-white ring-1 ring-slate-200 open:ring-gold-500/60 open:bg-gold-100/30 transition"><summary class="cursor-pointer px-5 py-4 flex items-center justify-between gap-3 font-head font-medium text-navy-900">' + esc(f.q) + '<span class="faq-icon text-2xl leading-none text-gold-600 transition">+</span></summary><p class="px-5 pb-5 -mt-1 text-slate-600 leading-relaxed break-words">' + linkify(f.a) + '</p></details>';
    }).join('');

    $('#cCat').innerHTML = '<option value="">— เลือกประเภทเรื่อง —</option>' + (c.complaintCategories || []).map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    $('#footerLinks').innerHTML = ((c.footer || {}).links || []).map(function (l) { return '<li><a class="hover:text-gold-400 transition" href="' + esc(safeUrl(l.href)) + '">' + esc(l.label) + '</a></li>'; }).join('');

    applyLayout(c);
    initChat(c.chatbot || {});
    paintIcons(document);
    observeReveal(document);
    observeCounters();
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
  var langMsg = { en: ['English', 'The assistant “Nong Assawin” now replies in English. Full English pages coming soon.'], zh: ['中文', '智能助手阿萨温现在用中文回答。中文网页即将推出。'], ru: ['Русский', 'Помощник Нонг Ассавин теперь отвечает по-русски. Русская версия сайта скоро появится.'], th: ['ภาษาไทย', 'น้องอัศวินตอบเป็นภาษาไทย'] };
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
    th: { ph: 'พิมพ์คำถาม…', hint: 'ถามน้องอัศวินได้เลย!', typing: 'กำลังพิมพ์', off: 'ขออภัยฮะ ขณะนี้ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้งนะฮะ', sub: 'ออนไลน์ · ตอบจากแหล่งข้อมูลทางราชการ', dis: '', hi: 'สวัสดีฮะ ผมน้องอัศวิน', tease: 'สวัสดีฮะ 👋', listen: 'กำลังฟัง… พูดได้เลยฮะ', spkOn: 'ปิดเสียงพูด', spkOff: 'เปิดเสียงพูด', replay: 'ฟังอีกครั้ง', mic: 'พูดเพื่อถาม', noVoice: 'อุปกรณ์นี้ยังไม่มีเสียงอ่านภาษาไทย (ลองใช้ Chrome/Edge หรือเพิ่มเสียงภาษาไทยในการตั้งค่าเครื่อง)', micErr: 'ใช้ไมโครโฟนไม่ได้ กรุณาอนุญาตการใช้ไมโครโฟนในเบราว์เซอร์' },
    en: { ph: 'Type your question…', hint: 'Ask me anything!', typing: 'typing', off: 'Sorry, the assistant is offline right now. Please try again.', sub: 'Online · answers from official sources', dis: 'Answers only from this website and official sources · Emergency 191 / 1155 / 1669', hi: 'Hi, I’m Nong Assawin, your Pattaya City helper', tease: 'Hello! 👋', listen: 'Listening… go ahead', spkOn: 'Mute voice', spkOff: 'Unmute voice', replay: 'Play again', mic: 'Speak to ask', noVoice: 'No English voice is available on this device.', micErr: 'Microphone unavailable. Please allow microphone access.' },
    zh: { ph: '请输入您的问题…', hint: '有问题问我吧！', typing: '正在输入', off: '抱歉，助手暂时无法连接，请稍后再试。', sub: '在线 · 依据官方来源回答', dis: '仅根据本网站及官方来源回答 · 紧急情况拨打 191 / 1155 / 1669', hi: '您好，我是阿萨温，芭提雅市执法小助手', tease: '您好！👋', listen: '正在聆听…请说', spkOn: '关闭语音', spkOff: '开启语音', replay: '再听一次', mic: '语音提问', noVoice: '此设备没有中文语音。', micErr: '无法使用麦克风，请在浏览器中允许麦克风权限。' },
    ru: { ph: 'Введите вопрос…', hint: 'Спросите меня!', typing: 'печатает', off: 'Извините, помощник сейчас недоступен. Попробуйте позже.', sub: 'Онлайн · ответы по официальным источникам', dis: 'Ответы только по данным сайта и официальным источникам · Экстренно 191 / 1155 / 1669', hi: 'Привет! Я Нонг Ассавин, помощник инспекции Паттайи', tease: 'Привет! 👋', listen: 'Слушаю… говорите', spkOn: 'Выключить голос', spkOff: 'Включить голос', replay: 'Прослушать снова', mic: 'Спросить голосом', noVoice: 'На этом устройстве нет русского голоса.', micErr: 'Микрофон недоступен. Разрешите доступ к микрофону.' }
  };
  // ภาพนิ่งสำรอง (ถ้า SVG/JS ของมาสคอตโหลดไม่ได้ ต้องยังเห็นน้องอัศวินเสมอ)
  function mascotImg(cls) { return '<img src="' + (bot.mascotStyle === 'robot' ? 'assets/mascot.png' : 'assets/mascot-officer.png') + '" alt="' + esc(bot.name || 'น้องอัศวิน') + '" class="mascot-fallback ' + (cls || '') + '" style="display:block;width:100%;height:100%;object-fit:contain" draggable="false">'; }
  function useMascot() { return bot.mascot !== false; }
  function avatarHtml(cls) {
    if (useMascot() && window.TKPMascot) { try { return window.TKPMascot.svg(logoUrl, cls, bot.mascotStyle); } catch (e) { console.error(e); } }
    if (useMascot()) return mascotImg('');
    return '<img src="' + esc(safeUrl(bot.avatar || logoUrl)) + '" alt="" class="w-full h-full object-contain rounded-full bg-gradient-to-br from-gold-300 to-gold-500 p-1">';
  }
  // อวาตาร์ในบับเบิลแชท: ภาพนิ่ง assets/mascot.png (เบา) · ถ้าปิดมาสคอตใช้รูปที่อัปโหลดเอง/โลโก้
  function bubbleAvatar() {
    if (!useMascot()) return '<span class="w-9 h-9 shrink-0">' + avatarHtml('static') + '</span>';
    return '<span class="w-9 h-9 shrink-0 rounded-full ring-2 ring-cyan-300/70 shadow-sm" role="img" aria-label="" style="background:url(' + esc(bot.mascotStyle === 'robot' ? 'assets/mascot.png' : 'assets/mascot-officer.png') + ') 50% -3px/140% auto no-repeat,linear-gradient(#f0f9ff,#cffafe)"></span>';
  }
  var heroBot = null;
  var HERO_LINES = { en: ['Hello! 👋', 'Ask me anything!', 'Tap me to chat!'], zh: ['你好！👋', '有问题尽管问我！', '点我开始聊天！'], ru: ['Привет! 👋', 'Спросите меня!', 'Нажмите, чтобы поговорить!'] };
  function heroLines() { if (curLang === 'th') return ((bot && bot.heroLines) || ['สวัสดีฮะ 👋', 'ถามน้องได้เลยฮะ', 'กดที่น้องเพื่อคุยกันฮะ']).map(pfx); return HERO_LINES[curLang] || HERO_LINES.en; }
  function figs() { return $$('#chatFabFig .mascot, #chatHeadFig .mascot, #chatHeroFig .mascot, #heroBotFig .mascot'); }
  function talk(on) { figs().forEach(function (m) { m.classList.toggle('talking', !!on); }); }
  function wave() { figs().forEach(function (m) { m.classList.remove('wave'); void m.getBoundingClientRect(); m.classList.add('wave'); setTimeout(function () { m.classList.remove('wave'); }, 2100); }); }
  function pfx(t) { var p = bot.particle; return (p == null || p === 'ฮะ') ? t : String(t).replace(/ฮะ(?=$|[\s.!?,…👋🙏])/gu, p); }
  function L(k) { var v = (CUI[curLang] || CUI.th)[k]; return curLang === 'th' && typeof v === 'string' ? pfx(v) : v; }
  /* ---- เสียงพูด/ฟัง (assets/voice.js) ---- */
  var V = window.TKPVoice, LANGBCP = { th: 'th', en: 'en', zh: 'zh', ru: 'ru' }, greeted = false, stopMic = null, noVoiceShown = {};
  function vcfg() { return bot.voice || {}; }
  function voiceAllowed() { return !!V && vcfg().enabled !== false && (V.supported.tts || vcfg().serverTts !== false); }
  function voiceOn() { return voiceAllowed() && localStorage.getItem('tkpVoice') !== 'off'; }
  function say() { figs().forEach(function (m) { m.classList.add('say'); clearTimeout(m.__say); m.__say = setTimeout(function () { m.classList.remove('say'); }, 110); }); }
  function speakText(text, btn) {
    if (!voiceOn()) return false;
    var v = vcfg();
    $$('.msg-say.on').forEach(function (b) { b.classList.remove('on'); });
    if (btn) btn.classList.add('on');
    V.speak(text, { lang: V.detectLang(text), gender: v.gender || 'male', rate: Number(v.rate) || 1, pitch: Number(v.pitch) || 1.1, serverTts: v.serverTts !== false }, {
      onstart: function () { talk(true); },
      onboundary: say,
      onend: function () { talk(false); if (btn) btn.classList.remove('on'); },
      onnovoice: function (lg) { if (!noVoiceShown[lg]) { noVoiceShown[lg] = 1; var n = document.createElement('p'); n.className = 'text-center text-[11px] text-slate-400 px-6'; n.textContent = '🔇 ' + L('noVoice'); $('#chatLog').appendChild(n); $('#chatLog').scrollTop = 1e9; } }
    });
    return true;
  }
  function paintSpk() {
    var b = $('#chatSpk'); if (!b) return;
    var ok = voiceAllowed(); b.classList.toggle('hidden', !ok); b.classList.toggle('flex', ok);
    var on = voiceOn(); b.setAttribute('aria-pressed', String(on)); b.title = on ? L('spkOn') : L('spkOff'); b.setAttribute('aria-label', b.title);
    $('.spk-on', b).classList.toggle('hidden', !on); $('.spk-off', b).classList.toggle('hidden', on);
    $$('.msg-say').forEach(function (x) { x.classList.toggle('hidden', !on); x.title = L('replay'); x.setAttribute('aria-label', L('replay')); });
    var m = $('#chatMic'); if (m) { var mok = !!V && V.supported.stt && vcfg().enabled !== false && vcfg().mic !== false; m.classList.toggle('hidden', !mok); m.classList.toggle('flex', mok); m.title = L('mic'); m.setAttribute('aria-label', L('mic')); }
  }
  function micState(on) {
    var m = $('#chatMic'), inp = $('#chatInput');
    m.classList.toggle('mic-on', on); m.setAttribute('aria-pressed', String(on));
    inp.classList.toggle('listening', on); inp.placeholder = on ? L('listen') : L('ph');
    figs().forEach(function (f) { f.classList.toggle('listening', on); });
  }
  function toggleMic() {
    if (stopMic) { stopMic(); return; }
    if (V) V.stop();
    stopMic = V.listen(curLang, {
      onstart: function () { micState(true); },
      oninterim: function (t) { $('#chatInput').value = t; },
      onfinal: function (t) { send(t); },
      onerror: function (e) { if (e === 'not-allowed' || e === 'service-not-allowed' || e === 'audio-capture') toast('🎤', L('micErr')); },
      onend: function () { stopMic = null; micState(false); }
    });
    if (!stopMic) micState(false);
  }
  function voiceGreeting() { var g = vcfg().greetings || {}; return pfx(g[curLang] || (curLang === 'th' ? 'สวัสดีฮะ น้องอัศวินยินดีต้อนรับสู่เทศกิจพัทยาฮะ' : g.en) || ''); }
  function greeting() { var g = bot.greetings || {}; return pfx(g[curLang] || (curLang === 'th' ? bot.greeting : g.en) || bot.greeting || 'สวัสดีฮะ'); }
  function chips() { var q = bot.quickRepliesI18n || {}; return q[curLang] || (curLang === 'th' ? bot.quickReplies : q.en) || bot.quickReplies || []; }
  function paintChat() {
    $('#chatInput').placeholder = stopMic ? L('listen') : L('ph'); $('#chatHintText').textContent = L('tease') + ' ' + L('hint');
    paintSpk();
    $('#chatSub').textContent = L('sub');
    $('#chatDisclaimer').textContent = L('dis') || bot.disclaimer || '';
    var hh = $('#chatHeroHi'); if (hh) hh.textContent = L('hi');
    $('#chatChips').innerHTML = chips().map(function (q) { return '<button type="button" class="chat-chip shrink-0 rounded-full border border-navy-800/20 bg-white text-navy-900 text-sm font-head px-3.5 py-1.5 hover:bg-gold-100 hover:border-gold-500 transition">' + esc(q) + '</button>'; }).join('');
    $$('.chat-chip').forEach(function (c) { c.addEventListener('click', function () { send(c.textContent); }); });
    var ha = $('#heroAsk');
    if (ha) {
      ha.innerHTML = chips().slice(0, window.innerWidth < 640 ? 2 : 3).map(function (q) { return '<button type="button" class="hero-ask rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/20 text-white text-sm font-head px-3.5 py-1.5 transition">' + esc(q) + '</button>'; }).join('');
      $$('.hero-ask', ha).forEach(function (b) { b.addEventListener('click', function () { openChat(true); setTimeout(function () { send(b.textContent); }, 250); }); });
    }
    if (heroBot) heroBot.refreshLines();
    if (greetEl && !userSpoke) { greetEl.remove(); greetEl = addMsg('bot', greeting()); }
  }
  function initChat(b) {
    bot = b || {};
    if (bot.enabled === false) { window.__tkpChatOff = true; var hb = $('#heroBot'); if (hb) hb.classList.add('hidden'); return; }
    logoUrl = safeUrl(((window.__content || {}).site || {}).logo || 'assets/logo.png');
    $('#chatRoot').classList.remove('hidden');
    $$('.bot-name').forEach(function (el) { el.textContent = bot.name || 'น้องอัศวิน'; });
    $('#chatFabFig').innerHTML = avatarHtml('');
    $('#chatHeadFig').innerHTML = avatarHtml('');
    var hf = $('#heroBotFig'), feats = (window.__content || {}).features || {};
    if (hf && !heroBot && feats.heroMascot !== false) {
      try {
      if (!window.TKPHeroMascot || !window.TKPMascot) throw new Error('hero mascot script not loaded');
      heroBot = window.TKPHeroMascot.mount({ el: hf, logo: logoUrl, style: bot.mascotStyle, dance: feats.heroDance !== false, lines: heroLines,
        onActivate: function () { var wasOpen = !$('#chatPanel').classList.contains('closed'); openChat(true); if (greeted && voiceOn()) { var g = voiceGreeting(); if (g && !wasOpen) speakText(g, greetEl && $('.msg-say', greetEl)); } } });
      window.__heroBot = heroBot;
      if (!hf.querySelector('svg')) throw new Error('hero mascot did not render');
      // while the big hero mascot is on screen, tuck the floating chat mascot away (no duplicate).
      // Only when he really rendered and is visible — otherwise the floating button always stays.
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
        var e = es[0], ok = e.isIntersecting && e.boundingClientRect.width > 40 && !!hf.querySelector('svg') && getComputedStyle($('#heroBot')).display !== 'none';
        document.body.classList.toggle('hero-bot-on', ok);
      }, { threshold: .25 }).observe($('#heroBot'));
      } catch (err) {
        console.error('[hero mascot] fallback to static image:', err);
        heroBot = null; document.body.classList.remove('hero-bot-on');
        var hbBody = $('#heroBotBody') || hf; hbBody.innerHTML = mascotImg('');
        if (!hf.__fb) { hf.__fb = true; hf.addEventListener('click', function () { openChat(true); }); }
      }
    }
    $('#chatDisclaimer').textContent = bot.disclaimer || '';
    if (!chatReady) {
      if (useMascot()) {
        var hero = document.createElement('div');
        hero.className = 'flex flex-col items-center text-center pt-1 pb-2';
        hero.innerHTML = '<span id="chatHeroFig" class="block w-32 h-36" style="background:radial-gradient(circle at 50% 58%,rgba(103,232,249,.35) 0,rgba(186,230,253,.25) 38%,transparent 66%)">' + avatarHtml('') + '</span><p class="mt-1 font-head font-semibold text-navy-900 bot-name">' + esc(bot.name || 'น้องอัศวิน') + '</p><p id="chatHeroHi" class="text-xs text-slate-500"></p>';
        $('#chatLog').appendChild(hero);
      }
      greetEl = addMsg('bot', greeting()); chatReady = true;
    }
    paintChat();
    var hint = $('#chatHint'); if (hint) { hint.classList.remove('hidden'); hint.classList.add('inline-flex'); }
    setTimeout(function () { var h = $('#chatHint'); if (h) { h.classList.add('hidden'); h.classList.remove('inline-flex', 'sm:inline-flex'); } }, 9000);
  }
  document.addEventListener('tkp:lang', function () { if (chatReady) paintChat(); });
  function addMsg(who, text) {
    var wrap = document.createElement('div');
    wrap.className = who === 'user' ? 'flex justify-end' : 'flex gap-2 items-end';
    wrap.innerHTML = who === 'user'
      ? '<div class="max-w-[82%] rounded-2xl rounded-br-md bg-navy-900 text-white px-4 py-2.5 text-[15px] leading-relaxed">' + esc(text).replace(/\n/g, '<br>') + '</div>'
      : bubbleAvatar() + '<div class="max-w-[84%] min-w-0 rounded-2xl rounded-bl-md bg-white ring-1 ring-slate-200 text-slate-800 px-4 py-2.5 text-[15px] leading-relaxed shadow-sm break-words">' + linkify(text) +
        (voiceAllowed() ? '<div class="flex justify-end -mb-1 -mr-2"><button type="button" class="msg-say' + (voiceOn() ? '' : ' hidden') + ' w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500" title="' + esc(L('replay')) + '" aria-label="' + esc(L('replay')) + '"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linejoin="round" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path stroke-linecap="round" d="M15.5 9a4 4 0 010 6M18.2 6.5a7.5 7.5 0 010 11"/></svg></button></div>' : '') + '</div>';
    $('#chatLog').appendChild(wrap); $('#chatLog').scrollTop = 1e9;
    $$('.chat-link', wrap).forEach(function (a) { a.addEventListener('click', function () { if (window.innerWidth < 640) openChat(false); }); });
    var sb = $('.msg-say', wrap); if (sb) sb.addEventListener('click', function () { if (sb.classList.contains('on')) { V.stop(); return; } speakText(text, sb); });
    return wrap;
  }
  function send(text) {
    text = String(text || '').trim(); if (!text) return;
    userSpoke = true; if (V) V.stop();
    addMsg('user', text); $('#chatInput').value = '';
    var typing = document.createElement('div'); typing.className = 'flex gap-2 items-end';
    typing.innerHTML = '<span class="w-9 h-10 shrink-0 -mb-1">' + avatarHtml('static talking') + '</span><div class="rounded-2xl rounded-bl-md bg-white ring-1 ring-slate-200 px-4 py-3.5 typing flex gap-1" aria-label="' + esc(L('typing')) + '"><span></span><span></span><span></span></div>';
    $('#chatLog').appendChild(typing); $('#chatLog').scrollTop = 1e9;
    talk(true);
    var started = Date.now();
    // ค้นเว็บไซต์ทางราชการอาจใช้เวลาหลายวินาที → บอกผู้ใช้ว่ากำลังค้นหา
    var SEARCHING = { th: 'กำลังค้นข้อมูลจากเว็บไซต์ทางราชการ…', en: 'Searching official websites…', zh: '正在检索官方网站…', ru: 'Ищу на официальных сайтах…' };
    var slowT = setTimeout(function () { var b = typing.querySelector('.typing'); if (b) { var p = document.createElement('p'); p.className = 'ml-1 text-xs text-slate-500 self-center'; p.textContent = SEARCHING[curLang] || SEARCHING.th; b.parentNode.appendChild(p); } }, 2200);
    fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, history: history.slice(-10), lang: curLang }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { return j.reply || j.error || '…'; })
      .catch(function () { return L('off'); })
      .then(function (reply) {
        clearTimeout(slowT);
        setTimeout(function () {
          typing.remove(); var w = addMsg('bot', reply); history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
          if (!speakText(reply, $('.msg-say', w))) setTimeout(function () { talk(false); }, Math.min(2600, 500 + reply.length * 12));
        }, Math.max(0, 900 - (Date.now() - started)));
      });
  }
  function openChat(open) {
    var small = window.innerWidth < 640;
    $('#chatPanel').classList.toggle('closed', !open); $('#chatFab').setAttribute('aria-expanded', String(open));
    $('#chatFab').classList.toggle('opacity-0', open && small); $('#chatFab').classList.toggle('pointer-events-none', open && small);
    var h = $('#chatHint'); if (h && open) h.classList.add('sm:hidden');
    if (open) setTimeout(wave, 120);
    if (!open && V) V.stop();
    if (!open && stopMic) stopMic();
    // ผู้ใช้คลิกเปิดแชท = มี user gesture → พูดทักทายได้ (นโยบาย autoplay ของเบราว์เซอร์)
    if (open && !greeted && voiceOn() && vcfg().autoGreet !== false) { greeted = true; var g = voiceGreeting(); if (g) setTimeout(function () { speakText(g, greetEl && $('.msg-say', greetEl)); }, 350); }
    if (open && !small) setTimeout(function () { $('#chatInput').focus({ preventScroll: true }); }, 200);
  }
  window.__openChat = openChat; window.__chatSend = send;
  $('#chatFab').addEventListener('click', function () { openChat($('#chatPanel').classList.contains('closed')); });
  $('#chatClose').addEventListener('click', function () { openChat(false); });
  $('#chatSpk').addEventListener('click', function () { var on = !voiceOn(); localStorage.setItem('tkpVoice', on ? 'on' : 'off'); if (!on && V) V.stop(); paintSpk(); });
  $('#chatMic').addEventListener('click', toggleMic);
  $('#chatForm').addEventListener('submit', function (e) { e.preventDefault(); send($('#chatInput').value); });
  $('#chatInput').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(this.value); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openChat(false); });
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('a[href="#chat"], [data-open-chat]'); if (!t) return; e.preventDefault(); openChat(true); });

  // ---------- boot ----------
  paintIcons(document);
  fetch('/api/content').then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .catch(function () { return fetch('data/content.json').then(function (r) { return r.json(); }); })
    .then(function (c) {
      window.__content = c;
      try { render(c); } catch (e) {
        // ส่วนใดส่วนหนึ่งพัง ต้องไม่ทำให้น้องอัศวิน/ปุ่มแชทหายไปทั้งหมด
        console.error('[render]', e); observeReveal(document);
        try { if (!chatReady) initChat(c.chatbot || {}); } catch (e2) { console.error('[chat]', e2); }
      }
    })
    .catch(function () { observeReveal(document); try { if (!chatReady) initChat({}); } catch (e) {} console.warn('content.json not available — run `npm start` and open http://localhost:3000'); });
})();
