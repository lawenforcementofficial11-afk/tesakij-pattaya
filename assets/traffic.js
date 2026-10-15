/* Live Pattaya Traffic — Google Maps JS (vector map + TrafficLayer, 3D tilt/orbit)
 * ใช้ traffic.googleMapsApiKey + traffic.googleMapsMapId จาก content.json (หรือ env GOOGLE_MAPS_API_KEY / GOOGLE_MAPS_MAP_ID)
 * ถ้าไม่มี key → โหมดสำรอง: Leaflet + OpenStreetMap (หมุดแจ้งเหตุใช้งานได้ครบ) + ปุ่ม 🚦 สลับดู iframe จราจรของ Google
 * แผนที่ทั้งสองโหมดส่ง adapter ให้ assets/alerts.js ผ่าน TKPAlerts.attach() */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var cfg, acfg = {}, lmap = null, ml = null, gframe = false, map, traffic, heading = 0, tilt = 60, orbit = true, visible = false, live = false, map3d = null, photoreal = false, refreshTimer;

  function clock() {
    var t = new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    $('#trafficClock').textContent = t + ' น.';
  }
  function gmLink(lat, lng, z) { return 'https://www.google.com/maps/@' + lat + ',' + lng + ',' + Math.round(z || 15) + 'z/data=!5m1!1e1'; }
  function embedSrc(lat, lng, z) { return 'https://maps.google.com/maps?q=' + lat + ',' + lng + '&ll=' + lat + ',' + lng + '&z=' + Math.round(z || 14) + '&t=m&layer=t&hl=th&output=embed'; }

  function renderSpots() {
    var spots = cfg.spots || [];
    $('#trafficSpots').innerHTML =
      '<button type="button" data-spot="-1" class="t-spot shrink-0 rounded-full glass-dark hover:bg-navy-800 px-4 py-2 font-head text-sm whitespace-nowrap chip-active">🌊 อ่าวพัทยา</button>' +
      spots.map(function (s, i) { return '<button type="button" data-spot="' + i + '" class="t-spot shrink-0 rounded-full glass-dark hover:bg-navy-800 px-4 py-2 font-head text-sm whitespace-nowrap" title="' + esc(s.nameEn) + '">' + esc(s.name) + '</button>'; }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.t-spot'), function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.t-spot'), function (x) { x.classList.toggle('chip-active', x === b); });
        var i = +b.dataset.spot, s = i < 0 ? { lat: cfg.center.lat, lng: cfg.center.lng, zoom: cfg.zoom, heading: heading } : spots[i];
        $('#trafficOpenGm').href = gmLink(s.lat, s.lng, s.zoom);
        if (live || ml) flyTo(s); else { if (lmap) lmap.flyTo([s.lat, s.lng], Math.min(Math.round(s.zoom || 15), 17), { duration: 1.2 }); if ($('#trafficFrame')) $('#trafficFrame').src = embedSrc(s.lat, s.lng, Math.min(s.zoom || 15, 16)); }
      });
    });
  }

  // ---------- fallback (no key) ----------
  // ---------- fallback (no key): MapLibre GL 3D (OpenFreeMap vector tiles + 3D buildings) → Leaflet → iframe ----------
  function loadMapLibre() {
    return new Promise(function (ok, no) {
      if (window.maplibregl) return ok();
      var s = document.createElement('script'); s.src = 'assets/vendor/maplibre/maplibre-gl.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s);
    });
  }
  function webglOK() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } }
  function fallback(reason) {
    live = false;
    if (reason) console.warn('[traffic] fallback:', reason);
    $('#trafficMap3d').classList.add('hidden'); $('#trafficMap').classList.remove('hidden');
    Array.prototype.forEach.call(document.querySelectorAll('.t-live'), function (b) { b.classList.add('hidden'); });
    $('#tBtnReal').classList.add('hidden');
    $('#trafficNotice').classList.remove('hidden');
    $('#tBtnGTraffic').classList.remove('hidden');
    $('#trafficLegend').classList.add('hidden');
    clock(); clearInterval(refreshTimer);
    if (map) { try { google.maps.event.clearInstanceListeners(map); } catch (e) {} map = null; }
    $('#trafficMap').innerHTML = '';
    if (webglOK() && cfg.fallbackStyleUrl !== '') {
      loadMapLibre().then(initMapLibre).catch(function (e) { console.warn('[traffic] maplibre failed', e); initLeaflet(); });
    } else initLeaflet();
  }
  var OFM_ATTR = '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
  function initMapLibre() {
    tilt = cfg.tilt || 60;
    ml = new maplibregl.Map({
      container: 'trafficMap', style: cfg.fallbackStyleUrl || 'https://tiles.openfreemap.org/styles/liberty',
      center: [cfg.center.lng, cfg.center.lat], zoom: Math.min(cfg.zoom || 16, 16), pitch: tilt, bearing: -15, maxPitch: 75,
      attributionControl: false, cooperativeGestures: true, fadeDuration: 150, preserveDrawingBuffer: true
    });
    ml.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right');
    ml.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }), 'bottom-right');
    ml.on('load', function () {
      try {
        if (ml.getLayer('building-3d')) {
          ml.setPaintProperty('building-3d', 'fill-extrusion-color', ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 0], 0, '#dfe6ee', 30, '#b9c8da', 80, '#8aa3c2', 200, '#5d7aa3']);
          ml.setPaintProperty('building-3d', 'fill-extrusion-opacity', 0.9);
        }
        ml.setSky && ml.setSky({ 'sky-color': '#9fd3ff', 'horizon-color': '#e6f4ff', 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.5, 'fog-color': '#ffffff', 'fog-ground-blend': 0.4 });
      } catch (e) {}
    });
    ['dragstart', 'mousedown', 'touchstart', 'wheel'].forEach(function (ev) { ml.on(ev, function (e) { if (e.originalEvent) setOrbit(false); }); });
    Array.prototype.forEach.call(document.querySelectorAll('.t-live'), function (b) { b.classList.remove('hidden'); });
    $('#tBtnTilt').textContent = '2D';
    $('#trafficMode').textContent = 'แผนที่ 3 มิติ · แจ้งเหตุสด · CCTV';
    $('#trafficCredit').innerHTML = 'แผนที่ 3 มิติ: OpenFreeMap · © OpenMapTiles · ข้อมูล © ผู้ร่วมพัฒนา OpenStreetMap (ODbL) · ชั้นข้อมูลจราจร (ปุ่ม 🚦) © Google · ภาพกล้อง © เมืองพัทยา';
    heading = -15; requestAnimationFrame(loop);
    attachAll(mlAdapter(ml));
  }
  function initLeaflet() {
    if (!window.L) { gframe = true; showGframe(true); return; }
    lmap = L.map($('#trafficMap'), { zoomControl: false, scrollWheelZoom: false, zoomSnap: 0.5 }).setView([cfg.center.lat, cfg.center.lng], cfg.fallbackZoom || 14.5);
    L.control.zoom({ position: 'bottomright' }).addTo(lmap);
    lmap.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    L.tileLayer(acfg.tileUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: acfg.tileAttribution || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(lmap);
    lmap.on('focus click', function () { lmap.scrollWheelZoom.enable(); });
    $('#trafficMode').textContent = 'แผนที่ OpenStreetMap · แจ้งเหตุสด';
    $('#trafficCredit').innerHTML = 'แผนที่ © ผู้ร่วมพัฒนา OpenStreetMap (ODbL) · ชั้นข้อมูลจราจร (ปุ่ม 🚦) © Google · ภาพกล้อง © เมืองพัทยา';
    attachAll(leafletAdapter(lmap));
  }
  function attachAll(ad) { if (window.TKPAlerts) TKPAlerts.attach(ad); if (window.TKPCCTV) TKPCCTV.attach(ad); }
  function showGframe(on) {
    var box = $('#trafficGframe');
    if (on && !box.firstChild) box.innerHTML = '<iframe id="trafficFrame" title="แผนที่ Google Maps เมืองพัทยา พร้อมสภาพการจราจร" class="w-full h-full border-0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen src="' + embedSrc(cfg.center.lat, cfg.center.lng, 14) + '"></iframe>';
    box.classList.toggle('hidden', !on);
    $('#trafficLegend').classList.toggle('hidden', !on);
    $('#tBtnGTraffic').setAttribute('aria-pressed', String(on)); $('#tBtnGTraffic').classList.toggle('chip-active', on);
    $('#trafficMode').textContent = on ? 'Google Maps · จราจร (หมุดแจ้งเหตุ/กล้องอยู่ในแผนที่ 3D)' : (ml ? 'แผนที่ 3 มิติ · แจ้งเหตุสด · CCTV' : 'แผนที่ OpenStreetMap · แจ้งเหตุสด');
    clearInterval(refreshTimer);
    if (on) refreshTimer = setInterval(function () { var f = $('#trafficFrame'); if (f && visible) { f.src = f.src; clock(); } }, Math.max(60, (cfg.refreshSeconds || 60) * 5) * 1000);
  }
  function wrapEl(html) { var el = document.createElement('div'); el.innerHTML = html; return el.firstChild; }
  function mlAdapter(m) {
    return {
      kind: 'maplibre',
      add: function (a, html, popupFn) {
        var el = document.createElement('div'); el.style.cssText = 'width:42px;height:42px'; el.innerHTML = html;
        var pop = new maplibregl.Popup({ offset: [0, -50], maxWidth: '290px', closeButton: true });
        pop.on('open', function () { pop.setHTML(popupFn()); setOrbit(false); });
        var mk = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -9] }).setLngLat([a.lng, a.lat]).setPopup(pop).addTo(m);
        return { remove: function () { mk.remove(); }, open: function () { if (!pop.isOpen()) mk.togglePopup(); }, refresh: function (h) { el.innerHTML = h; if (pop.isOpen()) pop.setHTML(popupFn()); } };
      },
      addEl: function (lat, lng, el, onClick) {
        el.addEventListener('click', function (e) { e.stopPropagation(); onClick(); });
        var mk = new maplibregl.Marker({ element: el, anchor: 'bottom', pitchAlignment: 'viewport', rotationAlignment: 'viewport' }).setLngLat([lng, lat]).addTo(m);
        return { remove: function () { mk.remove(); }, show: function (on) { el.style.display = on ? '' : 'none'; } };
      },
      flyTo: function (lat, lng, z, o) {
        if (gframe) toggleGframe(false); setOrbit(false); o = o || {};
        if (o.bearing != null) heading = o.bearing;
        m.flyTo({ center: [lng, lat], zoom: z || 17, pitch: o.pitch != null ? o.pitch : Math.max(m.getPitch(), 50), bearing: o.bearing != null ? o.bearing : m.getBearing(), duration: o.duration || 1800, essential: true, padding: o.padding || 0 });
      },
      center: function () { var c = m.getCenter(); return { lat: c.lat, lng: c.lng }; },
      fitAll: function () {}
    };
  }
  function leafletAdapter(m) {
    var ic = function (h) { return L.divIcon({ className: '', html: h, iconSize: [42, 42], iconAnchor: [21, 50], popupAnchor: [0, -46] }); };
    return {
      kind: 'leaflet',
      add: function (a, html, popupFn) {
        var mk = L.marker([a.lat, a.lng], { icon: ic(html), riseOnHover: true, zIndexOffset: a.official ? 500 : 0 });
        mk.bindPopup(function () { return popupFn(); }, { maxWidth: 280, minWidth: 220, autoPanPadding: [40, 60] });
        mk.addTo(m);
        return { remove: function () { m.removeLayer(mk); }, open: function () { mk.openPopup(); }, refresh: function (h) { mk.setIcon(ic(h)); if (mk.isPopupOpen()) mk.getPopup().setContent(popupFn()); } };
      },
      addEl: function (lat, lng, el, onClick) {
        var mk = L.marker([lat, lng], { icon: L.divIcon({ className: '', html: el.outerHTML, iconSize: [46, 64], iconAnchor: [23, 64] }) }).on('click', onClick).addTo(m);
        return { remove: function () { m.removeLayer(mk); }, show: function (on) { on ? mk.addTo(m) : m.removeLayer(mk); } };
      },
      flyTo: function (lat, lng, z) { if (gframe) toggleGframe(false); m.flyTo([lat, lng], Math.min(z || 17, 18), { duration: 1 }); },
      center: function () { var c = m.getCenter(); return { lat: c.lat, lng: c.lng }; },
      fitAll: function () {}
    };
  }
  function toggleGframe(on) { gframe = on; showGframe(on); }

  // ---------- live (vector map + traffic) ----------
  function loadScript() {
    window.__tkpMapsReady = function () { try { initLive(); } catch (e) { fallback(e.message); } };
    window.gm_authFailure = function () { fallback('Google Maps authentication failed (ตรวจสอบ API key / referrer)'); };
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(cfg.googleMapsApiKey) + '&v=' + (cfg.enablePhotorealistic ? 'beta' : 'weekly') + (cfg.enablePhotorealistic ? '&libraries=maps3d' : '') + '&language=th&region=TH&callback=__tkpMapsReady';
    s.onerror = function () { fallback('script load error'); };
    document.head.appendChild(s);
  }
  function initLive() {
    live = true; tilt = cfg.tilt || 60;
    map = new google.maps.Map($('#trafficMap'), {
      center: cfg.center, zoom: cfg.zoom || 16.5, tilt: tilt, heading: 0, mapId: cfg.googleMapsMapId || undefined,
      disableDefaultUI: true, zoomControl: true, gestureHandling: 'cooperative', isFractionalZoomEnabled: true, clickableIcons: false
    });
    traffic = new google.maps.TrafficLayer({ autoRefresh: true });
    traffic.setMap(map);
    if (!cfg.googleMapsMapId) console.warn('[traffic] ไม่มี Map ID — แผนที่จะเป็นแบบ raster (เอียง/หมุน 3D ไม่ได้)');
    Array.prototype.forEach.call(document.querySelectorAll('.t-live'), function (b) { b.classList.remove('hidden'); });
    if (cfg.enablePhotorealistic && window.customElements && customElements.get && google.maps.importLibrary) $('#tBtnReal').classList.remove('hidden');
    $('#tBtnTilt').textContent = '2D';
    $('#trafficMode').textContent = 'Live Traffic · 3D';
    ['dragstart', 'mousedown', 'touchstart'].forEach(function (ev) { map.addListener(ev, function () { setOrbit(false); }); });
    clock(); clearInterval(refreshTimer);
    refreshTimer = setInterval(function () { if (!visible) return; traffic.setMap(null); traffic.setMap(map); clock(); }, (cfg.refreshSeconds || 60) * 1000);
    requestAnimationFrame(loop);
    googleAdapter().then(attachAll);
  }
  function googleAdapter() {
    var iw = new google.maps.InfoWindow({ maxWidth: 290 });
    var useAdv = !!cfg.googleMapsMapId && google.maps.importLibrary;
    var libP = useAdv ? google.maps.importLibrary('marker').catch(function () { useAdv = false; }) : Promise.resolve();
    function svgIcon(a, t) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><path d="M20 46s16-15 16-27A16 16 0 004 19c0 12 16 27 16 27z" fill="' + (t.color || '#64748b') + '" stroke="' + (a.official ? '#F5C518' : '#fff') + '" stroke-width="3"/><text x="20" y="25" font-size="17" text-anchor="middle">' + (t.emoji || '📍') + '</text></svg>';
      return { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new google.maps.Size(40, 48), anchor: new google.maps.Point(20, 46) };
    }
    return libP.then(function () {
      return {
        kind: 'google',
        add: function (a, html, popupFn, t) {
          var mk, open = function () { iw.setContent(popupFn()); iw.open(useAdv ? { anchor: mk, map: map } : { anchor: mk, map: map }); setOrbit(false); };
          if (useAdv && google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            var el = document.createElement('div'); el.innerHTML = html; el.style.transform = 'translateY(-9px)';
            mk = new google.maps.marker.AdvancedMarkerElement({ map: map, position: { lat: a.lat, lng: a.lng }, content: el, zIndex: a.official ? 500 : 1, gmpClickable: true });
            mk.addListener('click', open);
            return { remove: function () { mk.map = null; }, open: open, refresh: function (h) { el.innerHTML = h; } };
          }
          mk = new google.maps.Marker({ map: map, position: { lat: a.lat, lng: a.lng }, icon: svgIcon(a, t || {}), zIndex: a.official ? 500 : 1 });
          mk.addListener('click', open);
          return { remove: function () { mk.setMap(null); }, open: open, refresh: function () { mk.setIcon(svgIcon(a, t || {})); } };
        },
        addEl: function (lat, lng, el, onClick) {
          var mk;
          if (useAdv && google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            mk = new google.maps.marker.AdvancedMarkerElement({ map: map, position: { lat: lat, lng: lng }, content: el, zIndex: 900, gmpClickable: true });
            mk.addListener('click', onClick);
            return { remove: function () { mk.map = null; }, show: function (on) { mk.map = on ? map : null; } };
          }
          var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="58" viewBox="0 0 44 58"><rect x="2" y="2" width="40" height="38" rx="11" fill="#0B2545" stroke="#F5C518" stroke-width="3"/><text x="22" y="28" font-size="19" text-anchor="middle">📹</text><rect x="20.5" y="40" width="3" height="14" fill="#F5C518"/><ellipse cx="22" cy="55" rx="9" ry="3" fill="#F5C518" opacity=".6"/></svg>';
          mk = new google.maps.Marker({ map: map, position: { lat: lat, lng: lng }, zIndex: 900, icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new google.maps.Size(44, 58), anchor: new google.maps.Point(22, 56) } });
          mk.addListener('click', onClick);
          return { remove: function () { mk.setMap(null); }, show: function (on) { mk.setMap(on ? map : null); } };
        },
        flyTo: function (lat, lng, z, o) { if (photoreal) togglePhotoreal(); setOrbit(false); o = o || {}; if (o.pitch != null && cfg.googleMapsMapId) tilt = Math.min(o.pitch, 67); flyTo({ lat: lat, lng: lng, zoom: z || 17.5, heading: o.bearing }); if (o.pitch != null && cfg.googleMapsMapId) map.moveCamera({ tilt: tilt }); },
        center: function () { var c = map.getCenter(); return { lat: c.lat(), lng: c.lng() }; },
        fitAll: function () {}
      };
    });
  }
  var last = 0;
  function loop(ts) {
    requestAnimationFrame(loop);
    if (!orbit || !visible || document.hidden) { last = ts; return; }
    var dt = Math.min(ts - last, 100); last = ts;
    heading = (heading + (cfg.orbitSpeed || 0.04) * dt / 16.7) % 360;
    if (ml) { if (!ml.isMoving()) ml.setBearing(heading); } else if (photoreal && map3d) map3d.heading = heading; else if (map && tilt > 0) map.moveCamera({ heading: heading });
  }
  function setOrbit(on) {
    orbit = on; $('#tBtnOrbit').setAttribute('aria-pressed', String(on));
    $('#tIcoPause').classList.toggle('hidden', !on); $('#tIcoPlay').classList.toggle('hidden', on);
  }
  function animate(from, to, ms, fn, done) {
    var t0 = performance.now();
    (function f(t) { var p = Math.min((t - t0) / ms, 1), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; fn(from + (to - from) * e, e); if (p < 1) requestAnimationFrame(f); else if (done) done(); })(t0);
  }
  function rotate(delta) {
    setOrbit(false);
    if (ml) { heading = ml.getBearing() + delta; ml.easeTo({ bearing: heading, duration: 600 }); return; }
    var h0 = heading;
    animate(0, delta, 600, function (d) { heading = (h0 + d + 360) % 360; if (photoreal && map3d) map3d.heading = heading; else map.moveCamera({ heading: heading }); });
  }
  function flyTo(s) {
    if (ml) { setOrbit(false); if (s.heading != null) heading = s.heading; ml.flyTo({ center: [s.lng, s.lat], zoom: Math.min(s.zoom || 16, 17.5), bearing: heading, pitch: tilt || 0, duration: 1800, essential: true }); return; }
    if (photoreal && map3d) { map3d.center = { lat: s.lat, lng: s.lng, altitude: 0 }; if (s.heading != null) map3d.heading = heading = s.heading; return; }
    var c0 = map.getCenter(), z0 = map.getZoom(), lat0 = c0.lat(), lng0 = c0.lng(), h0 = heading, h1 = s.heading != null ? s.heading : heading;
    var dh = ((h1 - h0 + 540) % 360) - 180;
    animate(0, 1, 1400, function (_, e) {
      heading = (h0 + dh * e + 360) % 360;
      map.moveCamera({ center: { lat: lat0 + (s.lat - lat0) * e, lng: lng0 + (s.lng - lng0) * e }, zoom: z0 + ((s.zoom || z0) - z0) * e - Math.sin(e * Math.PI) * 1.2, heading: heading });
    });
  }
  function togglePhotoreal() {
    photoreal = !photoreal;
    if (photoreal && !map3d) {
      google.maps.importLibrary('maps3d').then(function () {
        map3d = document.createElement('gmp-map-3d');
        var c = map.getCenter();
        map3d.setAttribute('center', c.lat() + ',' + c.lng() + ',0');
        map3d.setAttribute('range', '1800'); map3d.setAttribute('tilt', '67'); map3d.setAttribute('heading', String(heading));
        map3d.setAttribute('mode', 'hybrid');
        map3d.style.cssText = 'width:100%;height:100%;display:block';
        $('#trafficMap3d').appendChild(map3d);
      }).catch(function (e) { photoreal = false; console.warn('[traffic] 3D tiles unavailable', e); });
    }
    $('#trafficMap3d').classList.toggle('hidden', !photoreal); $('#trafficMap').classList.toggle('hidden', photoreal);
    $('#tBtnReal').classList.toggle('chip-active', photoreal); $('#tBtnTilt').disabled = photoreal;
    $('#trafficMode').textContent = photoreal ? 'Photorealistic 3D (ไม่มีชั้นข้อมูลจราจร)' : 'Live Traffic · 3D';
  }

  function bindControls() {
    $('#tBtnTilt').addEventListener('click', function () {
      tilt = tilt > 0 ? 0 : (cfg.tilt || 60);
      if (ml) { ml.easeTo({ pitch: tilt, bearing: tilt ? ml.getBearing() : 0, duration: 700 }); if (!tilt) { setOrbit(false); heading = 0; } this.textContent = tilt > 0 ? '2D' : '3D'; return; }
      var from = map.getTilt() || 0; animate(from, tilt, 700, function (v) { map.moveCamera({ tilt: v }); });
      if (tilt === 0) { setOrbit(false); animate(heading, heading > 180 ? 360 : 0, 700, function (v) { heading = v % 360; map.moveCamera({ heading: heading }); }); }
      this.textContent = tilt > 0 ? '2D' : '3D';
    });
    $('#tBtnLeft').addEventListener('click', function () { rotate(-45); });
    $('#tBtnRight').addEventListener('click', function () { rotate(45); });
    $('#tBtnOrbit').addEventListener('click', function () { setOrbit(!orbit); });
    $('#tBtnReal').addEventListener('click', togglePhotoreal);
    $('#tBtnGTraffic').addEventListener('click', function () { toggleGframe(!gframe); });
    $('#tBtnFull').addEventListener('click', function () {
      var el = $('#trafficCard');
      if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    });
  }

  window.TKPTraffic = {
    init: function (c, ac) {
      cfg = c || {}; acfg = ac || {};
      var sec = $('#traffic');
      if (cfg.enabled === false) { sec.classList.add('hidden'); return; }
      cfg.center = cfg.center || { lat: 12.9276, lng: 100.8771 };
      $('#trafficOpenGm').href = gmLink(cfg.center.lat, cfg.center.lng, 14);
      renderSpots(); bindControls();
      var started = false;
      var start = function () { if (started) return; started = true; cfg.googleMapsApiKey ? loadScript() : fallback();
        setInterval(clock, 1000); };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { es.forEach(function (e) { visible = e.isIntersecting; if (visible) start(); }); }, { rootMargin: '300px 0px' }).observe(sec);
      } else { visible = true; start(); }
    }
  };
})();
