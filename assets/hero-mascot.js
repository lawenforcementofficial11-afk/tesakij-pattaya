/* น้องอัศวินใน Hero — ตัวละคร "มีชีวิต" (SVG + CSS transforms เท่านั้น)
 * ท่าทาง: หายใจ/ลอย · กะพริบตา · หันซ้ายขวามองรอบ ๆ · โบกมือ · วันทยหัตถ์ · เต้นสั้น ๆ ทุก ~12–15 วินาที
 * เงาใต้เท้า + อนุภาคเรืองแสงสีฟ้า · ตามองเคอร์เซอร์ (เดสก์ท็อป) · คลิก/แตะ = กระโดดดีใจ + เปิดแชท
 * ประสิทธิภาพ: หยุดเมื่อเลื่อนพ้นจอ (IntersectionObserver) / แท็บซ่อน · เคารพ prefers-reduced-motion
 * TKPHeroMascot.mount({ el, logo, style, dance, lines: fn()→[], onActivate: fn }) */
(function () {
  'use strict';
  var CSS = [
    '.hb-wrap{display:grid;grid-template-columns:172px minmax(0,1fr);grid-template-areas:"stage bubble" "stage side";column-gap:12px;row-gap:10px;align-items:end}',
    '.hb-stage{grid-area:stage;position:relative;display:block;width:172px;height:206px;border:0;background:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}',
    '.hb-stage:focus-visible{outline:3px solid #F5C518;outline-offset:4px;border-radius:24px}',
    '.hb-bubble{grid-area:bubble;justify-self:start;position:relative;max-width:100%;background:#fff;color:#0B2545;border-radius:18px 18px 18px 6px;padding:.55rem .95rem;font:600 15px/1.35 Prompt,Sarabun,sans-serif;box-shadow:0 14px 30px -12px rgba(0,0,0,.55)}',
    '.hb-bubble::after{content:"";position:absolute;left:-7px;bottom:8px;border:8px solid transparent;border-right-color:#fff;border-left:0}',
    '.hb-bubble span{display:inline-block;transition:opacity .35s ease,transform .35s ease}',
    '.hb-bubble span.out{opacity:0;transform:translateY(6px)}',
    '.hb-side{grid-area:side;align-self:start}',
    '@media (min-width:640px){.hb-wrap{grid-template-columns:200px minmax(0,1fr)}.hb-stage{width:200px;height:238px}}',
    '@media (min-width:1024px){.hb-wrap{grid-template-columns:minmax(0,1fr);grid-template-areas:"bubble" "stage" "side";justify-items:center;text-align:center;row-gap:6px}',
    '  .hb-stage{width:min(380px,100%);height:430px}.hb-bubble{justify-self:center;font-size:18px;padding:.7rem 1.2rem;border-radius:22px;transform:translateX(-70px)}',
    '  .hb-bubble::after{left:30px;bottom:-8px;border:9px solid transparent;border-top-color:#fff;border-bottom:0}.hb-side #heroAsk{justify-content:center}}',
    '.hb-aura{position:absolute;left:8%;right:8%;top:16%;bottom:8%;border-radius:50%;background:radial-gradient(circle at 50% 55%,rgba(34,211,238,.38),rgba(14,165,233,.14) 45%,transparent 70%);filter:blur(6px);animation:hbAura 4s ease-in-out infinite}',
    '.hb-shadow{position:absolute;left:24%;right:24%;bottom:2.5%;height:6%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.55),rgba(8,145,178,.25) 60%,transparent);animation:hbShadow 4s ease-in-out infinite}',
    '.hb-body{position:absolute;inset:0;display:block;transform-origin:50% 92%;animation:hbBreathe 4s ease-in-out infinite}',
    '.hb-move{position:absolute;inset:0;display:block;transform-origin:50% 92%}',
    '.hb-particles i{position:absolute;bottom:18%;width:6px;height:6px;border-radius:50%;background:#67e8f9;box-shadow:0 0 10px 2px rgba(34,211,238,.8);opacity:0;animation:hbRise 5.5s linear infinite}',
    '.hb-particles i:nth-child(1){left:14%;animation-delay:0s}.hb-particles i:nth-child(2){left:28%;animation-delay:1.6s;width:4px;height:4px}',
    '.hb-particles i:nth-child(3){left:44%;animation-delay:3.1s}.hb-particles i:nth-child(4){left:62%;animation-delay:.8s;width:5px;height:5px}',
    '.hb-particles i:nth-child(5){left:78%;animation-delay:2.4s}.hb-particles i:nth-child(6){left:88%;animation-delay:4.2s;width:4px;height:4px}',
    '.hb-particles i:nth-child(7){left:8%;animation-delay:3.8s;width:4px;height:4px}.hb-particles i:nth-child(8){left:52%;animation-delay:4.9s;width:3px;height:3px}',
    // mascot parts (hero mode)
    '.mascot.hero .m-shadow{display:none}',
    '.mascot.hero .m-head{animation:none;transition:transform .8s cubic-bezier(.35,1.35,.5,1)}',
    '.mascot.hero:hover .m-head{animation:none}',
    '.mascot.hero.look-l .m-head{transform:translateX(-3px) rotate(-8deg)}',
    '.mascot.hero.look-r .m-head{transform:translateX(3px) rotate(7deg)}',
    '.mascot.hero.look-u .m-head{transform:translateY(-2px) rotate(-2deg)}',
    '.mascot.hero .m-eyeball{transition:transform .22s ease-out}',
    '.mascot.hero.mascot-officer .m-salute{animation:none!important;transform:rotate(-152deg);transition:transform .55s cubic-bezier(.3,1.3,.5,1)}',
    '.mascot.hero.mascot-officer.saluting .m-salute{transform:rotate(0deg)}',
    '.mascot.hero.saluting .m-head{transform:translateY(-1px) rotate(-3deg)}',
    '.mascot.hero.waving .m-arm2{animation:hbWave 2s ease-in-out both}',
    '.mascot.hero.waving .m-arm{animation:tmWave .42s ease-in-out 5 alternate}',
    '.mascot.joy .m-eyeball{opacity:0}.mascot.joy .m-happy{opacity:1}',
    '.hb-stage.dancing .hb-move{animation:hbDance 3.6s ease-in-out both}',
    '.hb-stage.dancing .hb-shadow{animation:hbShadowDance 3.6s ease-in-out both}',
    '.hb-stage.dancing .mascot .m-arm2{animation:hbArmR .45s ease-in-out 8 alternate}',
    '.hb-stage.dancing .mascot.mascot-officer .m-salute{animation:hbArmL .45s ease-in-out 8 alternate!important}',
    '.hb-stage.dancing .mascot .m-arm{animation:tmWave .45s ease-in-out 8 alternate}',
    '.hb-stage.dancing .mascot .m-eyeball{opacity:0}.hb-stage.dancing .mascot .m-happy{opacity:1}',
    '.hb-stage.jump .hb-move{animation:hbJump .8s cubic-bezier(.3,1.2,.5,1) both}',
    '.hb-stage.jump .hb-shadow{animation:hbShadowJump .8s ease both}',
    '.hb-stage.paused,.hb-stage.paused *{animation-play-state:paused!important}',
    '@keyframes hbBreathe{0%,100%{transform:scale(1,1)}50%{transform:scale(.992,1.014)}}',
    '@keyframes hbAura{0%,100%{opacity:.75;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}',
    '@keyframes hbShadow{0%,100%{transform:scaleX(1);opacity:.9}50%{transform:scaleX(.86);opacity:.65}}',
    '@keyframes hbRise{0%{transform:translateY(0) scale(.6);opacity:0}12%{opacity:.95}70%{opacity:.6}100%{transform:translateY(-230%) translateX(6px) scale(1);opacity:0}}',
    '@keyframes hbWave{0%{transform:rotate(0)}14%{transform:rotate(-150deg)}28%{transform:rotate(-122deg)}42%{transform:rotate(-155deg)}56%{transform:rotate(-122deg)}70%{transform:rotate(-150deg)}86%{transform:rotate(-140deg)}100%{transform:rotate(0)}}',
    '@keyframes hbArmR{from{transform:rotate(-15deg)}to{transform:rotate(-70deg)}}',
    '@keyframes hbArmL{from{transform:rotate(-128deg)}to{transform:rotate(-172deg)}}',
    '@keyframes hbDance{0%{transform:translate(0,0) rotate(0)}8%{transform:translate(-12px,-12px) rotate(-5deg)}16%{transform:translate(-18px,0) rotate(-3deg)}24%{transform:translate(-8px,-10px) rotate(3deg)}33%{transform:translate(4px,0) rotate(0)}41%{transform:translate(14px,-12px) rotate(5deg)}49%{transform:translate(18px,0) rotate(3deg)}57%{transform:translate(8px,-10px) rotate(-3deg)}66%{transform:translate(0,0) rotate(0)}74%{transform:translate(0,-16px) rotate(0) scale(1.02)}80%{transform:translate(0,0) scale(1.03,.96)}88%{transform:translate(0,-8px) rotate(-4deg)}100%{transform:translate(0,0) rotate(0)}}',
    '@keyframes hbShadowDance{0%,33%,66%,100%{transform:translateX(0) scaleX(1)}16%{transform:translateX(-18px) scaleX(.95)}49%{transform:translateX(18px) scaleX(.95)}74%{transform:scaleX(.7);opacity:.5}}',
    '@keyframes hbJump{0%{transform:translateY(0) scale(1)}15%{transform:translateY(0) scale(1.06,.9)}45%{transform:translateY(-34px) scale(.97,1.05)}70%{transform:translateY(0) scale(1.05,.93)}85%{transform:translateY(-6px) scale(1)}100%{transform:translateY(0)}}',
    '@keyframes hbShadowJump{0%,100%{transform:scaleX(1);opacity:.9}45%{transform:scaleX(.55);opacity:.35}}',
    '@media (prefers-reduced-motion:reduce){.hb-stage *,.hb-bubble span{animation:none!important;transition:none!important}.hb-particles{display:none}}'
  ].join('\n');
  function css() { if (document.getElementById('tkp-hero-mascot-css')) return; var s = document.createElement('style'); s.id = 'tkp-hero-mascot-css'; s.textContent = CSS; document.head.appendChild(s); }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mount(o) {
    css();
    var stage = o.el, body = stage.querySelector('.hb-body');
    if (!stage.querySelector('.hb-shadow')) { var sh = document.createElement('span'); sh.className = 'hb-shadow'; sh.setAttribute('aria-hidden', 'true'); stage.insertBefore(sh, body); }
    body.innerHTML = '<span class="hb-move">' + window.TKPMascot.svg(o.logo, 'hero', o.style) + '</span>';
    var svg = body.querySelector('.mascot'), say = document.getElementById(o.sayId || 'heroBotSay');
    var timers = [], running = false, li = 0, dance = o.dance !== false;
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function pulse(cls, ms, target) { target = target || svg; target.classList.add(cls); later(function () { target.classList.remove(cls); }, ms); }
    function busy() { return stage.classList.contains('dancing') || stage.classList.contains('jump') || svg.classList.contains('waving') || svg.classList.contains('saluting'); }
    // ---- พูด (บับเบิลวนข้อความ)
    function nextLine() {
      var lines = (o.lines && o.lines()) || []; if (!say || !lines.length) return;
      say.classList.add('out');
      later(function () { li = (li + 1) % lines.length; say.textContent = lines[li]; say.classList.remove('out'); }, 360);
    }
    // ---- ผู้กำกับท่าทาง
    var acts = 0;
    function look() { if (busy()) return; var k = ['look-l', 'look-r', 'look-u', 'look-l', 'look-r'][Math.floor(Math.random() * 5)]; pulse(k, 1500 + Math.random() * 600); }
    function wave() { if (busy()) return; svg.classList.remove('waving'); void svg.getBoundingClientRect(); pulse('waving', 2100); }
    function salute() { if (busy()) return; pulse('saluting', 1900); }
    function doDance() { if (!dance || busy()) return; stage.classList.remove('dancing'); void stage.offsetWidth; pulse('dancing', 3700, stage); }
    function loop() {
      if (!running) return;
      acts++;
      if (acts % 4 === 0) { (acts % 8 === 0 ? salute : wave)(); } else look();
      later(loop, 3000 + Math.random() * 900);
    }
    function danceLoop() { if (!running) return; doDance(); later(danceLoop, 12000 + Math.random() * 3000); }
    function bubbleLoop() { if (!running) return; nextLine(); later(bubbleLoop, 4200); }
    function start() {
      if (running || reduce) return; running = true; stage.classList.remove('paused');
      later(wave, 900); later(loop, 3200); later(bubbleLoop, 4200);
      if (dance) later(danceLoop, 7000 + Math.random() * 2000);
    }
    function stop() { running = false; clear(); stage.classList.add('paused'); ['dancing', 'jump'].forEach(function (c) { stage.classList.remove(c); }); ['waving', 'saluting', 'look-l', 'look-r', 'look-u', 'joy'].forEach(function (c) { svg.classList.remove(c); }); }
    // ---- ตามองเคอร์เซอร์
    var balls = svg.querySelectorAll('.m-eyeball'), raf = 0, mx = 0, my = 0;
    function onMove(e) {
      mx = e.clientX; my = e.clientY; if (raf || !running) return;
      raf = requestAnimationFrame(function () {
        raf = 0; var r = stage.getBoundingClientRect(); var cx = r.left + r.width / 2, cy = r.top + r.height * 0.33;
        var dx = mx - cx, dy = my - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, f = Math.min(1, d / 260);
        var tx = (dx / d) * 3.4 * f, ty = (dy / d) * 2.8 * f;
        for (var i = 0; i < balls.length; i++) balls[i].style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px)';
      });
    }
    if (!reduce && window.matchMedia && window.matchMedia('(pointer:fine)').matches) window.addEventListener('mousemove', onMove, { passive: true });
    // ---- คลิก/แตะ
    stage.addEventListener('click', function () {
      if (!reduce) { stage.classList.remove('dancing', 'jump'); void stage.offsetWidth; pulse('jump', 820, stage); pulse('joy', 1300); }
      if (o.onActivate) setTimeout(o.onActivate, reduce ? 0 : 380);
    });
    // ---- หยุดเมื่อพ้นจอ / แท็บซ่อน
    var visible = true;
    function sync() { (visible && !document.hidden) ? start() : stop(); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(stage);
    document.addEventListener('visibilitychange', sync);
    if (say && o.lines) { var l0 = o.lines(); if (l0 && l0.length) say.textContent = l0[0]; }
    sync();
    return {
      svg: svg, setDance: function (on) { dance = on; }, refreshLines: function () { var l = o.lines(); li = 0; if (say && l && l.length) say.textContent = l[0]; },
      // สำหรับภาพตัวอย่าง/ทดสอบ
      act: function (k) { ({ wave: wave, salute: salute, dance: doDance, look: look })[k](); }
    };
  }
  window.TKPHeroMascot = { mount: mount, css: CSS };
})();
