/* รถ 3 มิติ "ภาพจำลอง" บนแผนที่จราจรพัทยา
 * - ไม่ใช่ตำแหน่งรถจริง: รถวิ่งตามเส้นถนนจริงจาก OpenStreetMap (assets/roads-pattaya.geojson, ดึงครั้งเดียวผ่าน Overpass)
 * - ความเร็วอิงช่วงเวลา (ชั่วโมงเร่งด่วนช้าลง) และชะลอ/ต่อคิวใกล้จุดแจ้งเหตุ (อุบัติเหตุ รถติด ก่อสร้าง ฯลฯ)
 * - เรนเดอร์ด้วย three.js: MapLibre custom layer (โหมดไม่มี key) หรือ google.maps.WebGLOverlayView (มี key + Map ID)
 * พิกัดภายใน: x = ตะวันออก, y = ขึ้น, z = ใต้ (เมตร) รอบจุดศูนย์กลาง */
(function () {
  'use strict';
  var THREE, origin, roadsP = null, lanes = [], startsAt = {}, vehicles = [], meshes = {}, scene, world, glowMesh, lightsMesh, hemi, sun;
  var enabled = true, maxN = 150, built = false, lastT = 0, slowTimer = 0, visScale = 1, nightCache = { t: 0, v: false }, hourOverride = null;
  var hooks = { repaint: function () {} }, statsEl = null;
  var R = 6378137;

  function reduceMotion() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function bkkHour() {
    if (hourOverride != null) return hourOverride;
    var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var h = 0, m = 0; p.forEach(function (x) { if (x.type === 'hour') h = +x.value; if (x.type === 'minute') m = +x.value; });
    return (h % 24) + m / 60;
  }
  function isNight() { var n = performance.now(); if (n - nightCache.t > 30000 || hourOverride != null) { var h = bkkHour(); nightCache = { t: n, v: h >= 18.5 || h < 6 }; } return nightCache.v; }
  function todFactor() {
    var h = bkkHour();
    if ((h >= 7 && h < 9.5) || (h >= 16.5 && h < 19.5)) return 0.45;   // ชั่วโมงเร่งด่วน
    if (h >= 22 || h < 6) return 1.15;                                // กลางคืน ถนนโล่ง
    if (h >= 11 && h < 14) return 0.75;
    return 0.85;
  }
  function toXZ(lng, lat) { return [(lng - origin.lng) * Math.PI / 180 * R * Math.cos(origin.lat * Math.PI / 180), -(lat - origin.lat) * Math.PI / 180 * R]; }

  // ---------- roads → lanes ----------
  function buildLanes(gj) {
    var key = function (c) { return c[0].toFixed(5) + ',' + c[1].toFixed(5); };
    gj.features.forEach(function (f, fi) {
      var c = f.geometry.coordinates; if (!c || c.length < 2) return;
      var p = f.properties || {}, ow = p.oneway || 'no';
      var w = p.highway === 'trunk' ? 1 : p.highway === 'secondary' ? 1.3 : 0.9;
      if (/Pattaya (Sai Nueng|Sai Song|Klang|Nuea|Tai)|Jomtien|Thappraya|Beach/i.test(p.name || '')) w *= 3;
      var dirs = ow === 'yes' || ow === 'true' || ow === '1' ? [1] : ow === '-1' ? [-1] : [1, -1];
      dirs.forEach(function (d) {
        var cc = d > 0 ? c : c.slice().reverse(), pts = cc.map(function (q) { return toXZ(q[0], q[1]); });
        var cum = [0], dir = [], len = 0;
        for (var i = 1; i < pts.length; i++) {
          var dx = pts[i][0] - pts[i - 1][0], dz = pts[i][1] - pts[i - 1][1], L = Math.hypot(dx, dz) || 0.01;
          len += L; cum.push(len); dir.push([dx / L, dz / L]);
        }
        if (len < 15) return;
        var mid = pts[Math.floor(pts.length / 2)], dist = Math.hypot(mid[0], mid[1]);
        var lane = { far: dist > 3200, id: lanes.length, f: fi, d: d, pts: pts, cum: cum, dir: dir, len: len, two: dirs.length === 2, sKey: key(cc[0]), eKey: key(cc[cc.length - 1]), w: w * len * Math.exp(-dist / 1100), slow: new Float32Array(pts.length).fill(1), name: p.name || '' };
        lanes.push(lane);
        (startsAt[lane.sKey] = startsAt[lane.sKey] || []).push(lane);
      });
    });
  }
  function pickLane() {
    var tot = 0; lanes.forEach(function (l) { tot += l.w; });
    var r = Math.random() * tot;
    for (var i = 0; i < lanes.length; i++) { r -= lanes[i].w; if (r <= 0) return lanes[i]; }
    return lanes[0];
  }
  function nextLane(l) {
    var opts = (startsAt[l.eKey] || []).filter(function (n) { return !(n.f === l.f && n.d !== l.d); });
    if (!opts.length) return null;
    // ชอบถนนสายหลักและไม่เลี้ยวหักศอก
    var ld = l.dir[l.dir.length - 1], best = null, bs = -9;
    opts.forEach(function (n) { var nd = n.dir[0], s = ld[0] * nd[0] + ld[1] * nd[1] + Math.random() * 0.9; if (s > bs) { bs = s; best = n; } });
    return best;
  }

  // ---------- vehicles ----------
  var TYPES = {
    car: { p: 0.56, v: 11.5, len: 4.4, colors: [0xf8fafc, 0xcbd5e1, 0x111827, 0xb91c1c, 0x1d4ed8, 0x6b7280, 0xf59e0b] },
    moto: { p: 0.22, v: 12.5, len: 2.0, colors: [0x111827, 0xdc2626, 0x2563eb, 0xf8fafc] },
    songthaew: { p: 0.16, v: 8.5, len: 5.0, colors: [0x1e3a8a, 0x1e40af] },
    bus: { p: 0.06, v: 8, len: 11, colors: [0xf8fafc, 0xf97316] }
  };
  var TS = { car: 1, moto: 1.25, songthaew: 0.85, bus: 0.55 };
  function randType() { var r = Math.random(), a = 0; for (var k in TYPES) { a += TYPES[k].p; if (r <= a) return k; } return 'car'; }
  function spawn(v) {
    v = v || {};
    v.type = v.type || randType(); var T = TYPES[v.type];
    v.lane = pickLane(); v.s = Math.random() * v.lane.len; v.seg = 0; v.v = T.v * (0.6 + Math.random() * 0.4);
    v.want = T.v * (0.85 + Math.random() * 0.3); v.len = T.len * TS[v.type];
    v.color = v.color || new THREE.Color(T.colors[(Math.random() * T.colors.length) | 0]);
    syncSeg(v); return v;
  }
  function syncSeg(v) { var c = v.lane.cum; while (v.seg < c.length - 2 && c[v.seg + 1] < v.s) v.seg++; while (v.seg > 0 && c[v.seg] > v.s) v.seg--; }

  // ช้าลงใกล้จุดแจ้งเหตุ
  var ALERT_EFFECT = { jam: [260, 0.18], accident: [170, 0.2], construction: [140, 0.35], flood: [160, 0.3], hazard: [90, 0.5] };
  function refreshSlow() {
    var st = (window.TKPAlerts && TKPAlerts._store) || {}, list = [];
    Object.keys(st).forEach(function (k) { var a = st[k], e = ALERT_EFFECT[a.type]; if (e && Date.parse(a.expiresAt) > Date.now()) { var p = toXZ(a.lng, a.lat); list.push([p[0], p[1], e[0], e[1]]); } });
    lanes.forEach(function (l) {
      for (var i = 0; i < l.pts.length; i++) {
        var f = 1, p = l.pts[i];
        for (var j = 0; j < list.length; j++) { var a = list[j], d = Math.hypot(p[0] - a[0], p[1] - a[1]); if (d < a[2]) f = Math.min(f, a[3] + (1 - a[3]) * Math.pow(d / a[2], 2)); }
        l.slow[i] = f;
      }
    });
  }
  function step(dt) {
    var tod = todFactor(), byLane = {};
    vehicles.forEach(function (v) { (byLane[v.lane.id] = byLane[v.lane.id] || []).push(v); });
    Object.keys(byLane).forEach(function (k) {
      var arr = byLane[k].sort(function (a, b) { return a.s - b.s; });
      for (var i = 0; i < arr.length; i++) {
        var v = arr[i], l = v.lane, lead = arr[i + 1];
        var slow = Math.min(l.slow[v.seg], l.slow[Math.min(v.seg + 1, l.pts.length - 1)]);
        var target = v.want * tod * slow;
        var gap = lead ? lead.s - v.s - (lead.len + v.len) / 2 * visScale : 1e9;
        if (!lead) { var rest = l.len - v.s; if (rest < 40) { var nl = nextLane(l); v._next = nl; } }
        var safe = Math.max(0, (gap - 2.5 * visScale) / 1.3);
        target = Math.min(target, safe);
        var acc = target > v.v ? 2.2 : 6;
        v.v += Math.max(-acc * dt, Math.min(acc * dt, target - v.v));
        v.s += v.v * dt;
        if (v.s >= l.len) {
          var n = v._next || nextLane(l); v._next = null;
          if (n && n.far !== true) { v.s -= l.len; v.lane = n; v.seg = 0; } else spawn(v);
        }
        syncSeg(v);
      }
    });
  }

  // ---------- three.js models ----------
  function box(w, h, d, x, y, z, col) { var g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.translate(x, y, z); paint(g, col); return g; }
  function paint(g, col) { var c = new THREE.Color(col), n = g.attributes.position.count, a = new Float32Array(n * 3); for (var i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
  function merge(list) {
    var n = 0; list.forEach(function (g) { n += g.attributes.position.count; });
    var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), o = 0;
    list.forEach(function (g) { pos.set(g.attributes.position.array, o); nor.set(g.attributes.normal.array, o); col.set(g.attributes.color.array, o); o += g.attributes.position.count * 3; });
    var m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('color', new THREE.BufferAttribute(col, 3)); return m;
  }
  // แกนรถ: +x = หน้ารถ, y = ขึ้น, z = ขวา
  var W = 0xffffff, GL = 0x1f2937, TY = 0x0b0b0b;
  function geomCar() { return merge([box(4.4, 0.75, 1.85, 0, 0.55, 0, W), box(2.3, 0.6, 1.6, -0.25, 1.22, 0, GL), box(2.1, 0.08, 1.62, -0.25, 1.55, 0, W), box(0.7, 0.5, 2.0, 1.35, 0.3, 0, TY), box(0.7, 0.5, 2.0, -1.35, 0.3, 0, TY)]); }
  function geomMoto() { return merge([box(1.9, 0.35, 0.35, 0, 0.55, 0, W), box(0.6, 0.6, 0.6, 1.05, 0.35, 0, TY), box(0.6, 0.6, 0.6, -0.85, 0.35, 0, TY), box(0.45, 0.8, 0.5, -0.15, 1.15, 0, 0xfde68a), box(0.35, 0.35, 0.35, -0.1, 1.75, 0, 0x111827)]); }
  function geomSongthaew() { return merge([box(1.6, 1.0, 1.9, 1.7, 0.8, 0, W), box(1.0, 0.55, 1.75, 1.75, 1.55, 0, GL), box(3.2, 0.5, 1.95, -0.7, 0.55, 0, W), box(3.3, 0.12, 2.05, -0.7, 2.25, 0, W), box(0.12, 1.5, 0.12, -2.25, 1.5, 0.95, 0xd1d5db), box(0.12, 1.5, 0.12, -2.25, 1.5, -0.95, 0xd1d5db), box(0.12, 1.5, 0.12, 0.85, 1.5, 0.95, 0xd1d5db), box(0.12, 1.5, 0.12, 0.85, 1.5, -0.95, 0xd1d5db), box(3.0, 0.35, 0.3, -0.7, 1.0, 0.85, 0x9ca3af), box(3.0, 0.35, 0.3, -0.7, 1.0, -0.85, 0x9ca3af), box(0.7, 0.5, 2.1, 1.6, 0.3, 0, TY), box(0.7, 0.5, 2.1, -1.6, 0.3, 0, TY)]); }
  function geomBus() { return merge([box(11, 2.6, 2.5, 0, 1.75, 0, W), box(10.4, 0.9, 2.52, -0.1, 2.3, 0, GL), box(0.2, 1.3, 2.3, 5.45, 2.0, 0, GL), box(1, 0.6, 2.6, 3.6, 0.35, 0, TY), box(1, 0.6, 2.6, -3.6, 0.35, 0, TY)]); }
  function geomLights(len, w, h) { return merge([box(0.15, 0.22, 0.32, len / 2 + 0.02, h, w / 2 - 0.3, 0xfff7c2), box(0.15, 0.22, 0.32, len / 2 + 0.02, h, -w / 2 + 0.3, 0xfff7c2), box(0.12, 0.2, 0.3, -len / 2 - 0.02, h, w / 2 - 0.3, 0xff2020), box(0.12, 0.2, 0.3, -len / 2 - 0.02, h, -w / 2 + 0.3, 0xff2020)]); }
  function glowTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d');
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,240,190,1)'); g.addColorStop(0.4, 'rgba(255,225,150,.7)'); g.addColorStop(1, 'rgba(255,220,140,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); var t = new THREE.CanvasTexture(c); return t;
  }
  function buildScene() {
    scene = new THREE.Scene(); world = new THREE.Group(); scene.add(world);
    hemi = new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.0); world.add(hemi);
    sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(-60, 120, 40); world.add(sun);
    var n = vehicles.length, counts = {};
    vehicles.forEach(function (v) { counts[v.type] = (counts[v.type] || 0) + 1; });
    var mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    var geo = { car: geomCar(), moto: geomMoto(), songthaew: geomSongthaew(), bus: geomBus() };
    Object.keys(geo).forEach(function (k) {
      var m = new THREE.InstancedMesh(geo[k], mat, Math.max(1, counts[k] || 0)); m.frustumCulled = false; m.count = counts[k] || 0; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); meshes[k] = m; world.add(m);
    });
    var lg = geomLights(4.4, 1.85, 0.6);
    lightsMesh = new THREE.InstancedMesh(lg, new THREE.MeshBasicMaterial({ vertexColors: true }), n); lightsMesh.frustumCulled = false; world.add(lightsMesh);
    var pg = new THREE.PlaneGeometry(12, 7); pg.rotateX(-Math.PI / 2); pg.translate(8, 0.2, 0);
    glowMesh = new THREE.InstancedMesh(pg, new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 }), n); glowMesh.frustumCulled = false; world.add(glowMesh);
    // ให้แต่ละคันมี index ใน mesh ของประเภทตัวเอง
    var idx = {}; vehicles.forEach(function (v) { v.mi = idx[v.type] = (idx[v.type] || 0); idx[v.type]++; meshes[v.type].setColorAt(v.mi, v.color); });
    Object.keys(meshes).forEach(function (k) { if (meshes[k].instanceColor) meshes[k].instanceColor.needsUpdate = true; });
  }
  var _m, _q, _p, _s, _y;
  function writeMatrices() {
    if (!_q) { _m = new THREE.Matrix4(); _q = new THREE.Quaternion(); _p = new THREE.Vector3(); _s = new THREE.Vector3(); _y = new THREE.Vector3(0, 1, 0); }
    var night = isNight(), k = visScale;
    hemi.intensity = night ? 0.45 : 1.0; sun.intensity = night ? 0.15 : 0.8; glowMesh.material.opacity = 1;
    glowMesh.visible = night;
    vehicles.forEach(function (v, i) {
      var l = v.lane, sg = v.seg, a = l.pts[sg], dr = l.dir[Math.min(sg, l.dir.length - 1)];
      var t = v.s - l.cum[sg], x = a[0] + dr[0] * t, z = a[1] + dr[1] * t;
      // ชิดซ้ายตามการขับขี่ของไทย (ถนนสองทาง)
      var off = (l.two ? 3.2 : 1.2) * k + (v.type === 'moto' ? 1.4 * k : 0);
      // ด้านซ้ายของทิศทาง (dx,dz) ในระบบ x=ตะวันออก z=ใต้ คือ (dz, -dx)
      x += dr[1] * off; z += -dr[0] * off;
      var kk = k * TS[v.type];
      _p.set(x, 0, z); _q.setFromAxisAngle(_y, Math.atan2(-dr[1], dr[0])); _s.set(kk, kk, kk);
      _m.compose(_p, _q, _s); meshes[v.type].setMatrixAt(v.mi, _m);
      if (v.type === 'bus') _s.set(kk * 2.5, kk, kk * 1.35); else if (v.type === 'moto') _s.set(kk * 0.45, kk, kk * 0.35); else if (v.type === 'songthaew') _s.set(kk * 1.13, kk * 1.4, kk * 1.05);
      _m.compose(_p, _q, _s); lightsMesh.setMatrixAt(i, _m);
      _s.set(kk * (v.type === 'moto' ? 0.6 : 1), kk, kk * (v.type === 'moto' ? 0.6 : 1)); _m.compose(_p, _q, _s); glowMesh.setMatrixAt(i, _m);
    });
    Object.keys(meshes).forEach(function (kk) { meshes[kk].instanceMatrix.needsUpdate = true; });
    lightsMesh.instanceMatrix.needsUpdate = true; glowMesh.instanceMatrix.needsUpdate = true;
  }
  function tick(now) {
    var dt = Math.min(0.1, (now - (lastT || now)) / 1000); lastT = now;
    if (dt > 0) step(dt * 2); // เร่งเวลา ×2 ให้เห็นการเคลื่อนไหวชัดขึ้น
    if ((slowTimer -= dt) <= 0) { slowTimer = 3; refreshSlow(); }
    writeMatrices();
  }
  function running() { return enabled && built && !document.hidden && (!window.TKPTraffic || !TKPTraffic.isVisible || TKPTraffic.isVisible()); }

  function prepare(center) {
    origin = { lat: center.lat, lng: center.lng };
    if (!roadsP) roadsP = fetch('assets/roads-pattaya.geojson').then(function (r) { return r.json(); }).then(function (gj) {
      THREE = window.THREE; buildLanes(gj);
      maxN = innerWidth < 640 ? 60 : 150;
      for (var i = 0; i < maxN; i++) vehicles.push(spawn());
      buildScene(); refreshSlow(); built = true;
      for (var j = 0; j < 40; j++) step(0.5); // warm-up ให้เกิดคิวตามธรรมชาติ
    });
    return roadsP;
  }
  function loadThree() {
    return new Promise(function (ok, no) { if (window.THREE) return ok(); var s = document.createElement('script'); s.src = 'assets/vendor/three/three.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  }

  // ---------- MapLibre custom layer ----------
  function attachMapLibre(map, center) {
    return loadThree().then(function () { return prepare(center); }).then(function () {
      var o = maplibregl.MercatorCoordinate.fromLngLat([origin.lng, origin.lat], 0), s = o.meterInMercatorCoordinateUnits();
      var M = new THREE.Matrix4().set(s, 0, 0, o.x, 0, 0, s, o.y, 0, s, 0, o.z, 0, 0, 0, 1);
      var camera = new THREE.Camera(), renderer;
      var layer = {
        id: 'tkp-sim-cars', type: 'custom', renderingMode: '3d',
        onAdd: function (m, gl) { renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true }); renderer.autoClear = false; },
        render: function (gl, matrix) {
          if (!enabled) return;
          visScale = Math.max(2, Math.min(7, Math.pow(2, 18.7 - map.getZoom())));
          var go = running(); if (go) tick(performance.now()); else { lastT = 0; writeMatrices(); }
          camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix).multiply(M);
          renderer.resetState(); renderer.render(scene, camera);
          if (go) map.triggerRepaint();
        }
      };
      var add = function () { if (map.getLayer('tkp-sim-cars')) return; try { map.addLayer(layer); } catch (e) { map.once('idle', add); } };
      add();
      map.on('styledata', function () { if (enabled && !map.getLayer('tkp-sim-cars')) add(); });
      hooks.repaint = function () { map.triggerRepaint(); };
    });
  }
  // ---------- Google Maps WebGLOverlayView (ต้องเป็น vector map ที่มี Map ID) ----------
  function attachGoogle(gmap, center) {
    if (!google.maps.WebGLOverlayView) return Promise.resolve();
    return loadThree().then(function () { return prepare(center); }).then(function () {
      var ov = new google.maps.WebGLOverlayView(), renderer, camera = new THREE.PerspectiveCamera();
      world.rotation.x = Math.PI / 2; // y ขึ้น → z ขึ้น, z ใต้ → -y (เหนือ = +y)
      ov.onContextRestored = function (o) { renderer = new THREE.WebGLRenderer({ canvas: o.gl.canvas, context: o.gl, antialias: true }); renderer.autoClear = false; };
      ov.onDraw = function (o) {
        if (!enabled) return;
        visScale = Math.max(2, Math.min(7, Math.pow(2, 18.7 - (gmap.getZoom() || 16))));
        var go = running(); if (go) tick(performance.now()); else lastT = 0;
        camera.projectionMatrix = new THREE.Matrix4().fromArray(o.transformer.fromLatLngAltitude({ lat: origin.lat, lng: origin.lng, altitude: 0 }));
        renderer.render(scene, camera); renderer.resetState();
        if (go) ov.requestRedraw();
      };
      ov.setMap(gmap);
      hooks.repaint = function () { ov.requestRedraw(); };
    });
  }

  function setEnabled(on) {
    enabled = !!on;
    if (scene) scene.visible = enabled;
    Array.prototype.forEach.call(document.querySelectorAll('[data-sim-badge]'), function (el) { el.classList.toggle('hidden', !enabled); });
    var b = document.getElementById('tBtnSim'); if (b) { b.classList.toggle('chip-active', enabled); b.setAttribute('aria-pressed', String(enabled)); }
    lastT = 0; hooks.repaint();
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { lastT = 0; hooks.repaint(); } });

  window.TKPSim = {
    defaultOn: function () { return !reduceMotion(); },
    attachMapLibre: attachMapLibre, attachGoogle: attachGoogle,
    setEnabled: setEnabled, isEnabled: function () { return enabled; },
    wake: function () { lastT = 0; hooks.repaint(); },
    _setHour: function (h) { hourOverride = h; nightCache.t = 0; hooks.repaint(); },
    _stats: function () { return { lanes: lanes.length, vehicles: vehicles.length, avgSpeedKmh: vehicles.reduce(function (a, v) { return a + v.v; }, 0) / Math.max(1, vehicles.length) * 3.6 }; }
  };
})();
