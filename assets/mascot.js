/* น้องAIเทศกิจพัทยา — มาสคอตหุ่นยนต์ต้นฉบับ (ออกแบบใหม่ทั้งหมด ไม่ได้ลอก/ตามรอยภาพใด) วาดด้วย SVG หลายเลเยอร์ + แอนิเมชัน CSS
 * TKPMascot.svg(logoUrl, extraClass) → string
 *   คลาสเสริม: wave (โบกมือ) · talking (ขยับปาก/ตาเรืองแสงขณะตอบ) · static (หยุดลอย/เอียงหัว)
 *   แอนิเมชันพื้นฐาน: ลอยขึ้นลง · กะพริบตา · เอียงหัว · ไฟอก/ตาเรืองแสงเป็นจังหวะ · hover = โบกมือ + เอียงหัว + ตายิ้ม
 * ตราโล่เทศกิจพัทยาที่หน้าอกใช้ภาพจริงจาก site.logo (assets/logo.png) */
(function () {
  'use strict';
  var n = 0;
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var CSS = [
    '.mascot{overflow:visible;display:block}',
    '.mascot *{transform-box:view-box}',
    '.mascot .m-bob{animation:tmBob 3.6s ease-in-out infinite}',
    '.mascot .m-shadow{transform-origin:80px 184px;animation:tmShadow 3.6s ease-in-out infinite}',
    '.mascot .m-head{transform-origin:80px 110px;animation:tmTilt 7s ease-in-out infinite}',
    '.mascot .m-eye{transform-box:fill-box;transform-origin:center;animation:tmBlink 5s infinite}',
    '.mascot .m-eye2{animation-delay:.04s}',
    '.mascot .m-glow{animation:tmGlow 2.6s ease-in-out infinite}',
    '.mascot .m-arm{transform-origin:47px 121px}',
    '.mascot .m-arm2{transform-origin:113px 121px;animation:tmSway 3.6s ease-in-out infinite}',
    '.mascot .m-talk,.mascot .m-happy{opacity:0}',
    '.mascot.wave .m-arm{animation:tmWave .42s ease-in-out 6 alternate}',
    '.mascot.talking .m-smile{opacity:0}',
    '.mascot.talking .m-talk{opacity:1;transform-box:fill-box;transform-origin:center top;animation:tmTalk .16s ease-in-out infinite alternate}',
    '.mascot.talking .m-glow{animation-duration:.7s}',
    '.mascot.talking .m-iris{transform-box:fill-box;transform-origin:center;animation:tmIris .32s ease-in-out infinite alternate}',
    '.mascot.static .m-bob,.mascot.static .m-shadow,.mascot.static .m-head,.mascot.static .m-arm2{animation:none}',
    '.mascot:hover .m-arm,#chatFab:hover .mascot .m-arm{animation:tmWave .42s ease-in-out 4 alternate}',
    '.mascot:hover .m-head,#chatFab:hover .mascot .m-head{animation:tmHover .9s ease-in-out both}',
    '.mascot:hover .m-eyeball,#chatFab:hover .mascot .m-eyeball{opacity:0}',
    '.mascot:hover .m-happy,#chatFab:hover .mascot .m-happy{opacity:1}',
    '@keyframes tmBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
    '@keyframes tmShadow{0%,100%{transform:scaleX(1);opacity:1}50%{transform:scaleX(.82);opacity:.6}}',
    '@keyframes tmTilt{0%,100%{transform:rotate(0)}20%{transform:rotate(-4deg)}45%{transform:rotate(0)}70%{transform:rotate(3.5deg)}}',
    '@keyframes tmHover{0%{transform:rotate(0)}40%{transform:rotate(-9deg) translateY(-2px)}100%{transform:rotate(-6deg)}}',
    '@keyframes tmBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}',
    '@keyframes tmGlow{0%,100%{opacity:.55}50%{opacity:1}}',
    '@keyframes tmWave{from{transform:rotate(8deg)}to{transform:rotate(-24deg)}}',
    '@keyframes tmSway{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg)}}',
    '@keyframes tmTalk{from{transform:scaleY(.3)}to{transform:scaleY(1.1)}}',
    '@keyframes tmIris{from{transform:scale(1)}to{transform:scale(1.18)}}',
    '@media (prefers-reduced-motion:reduce){.mascot *{animation:none!important}}'
  ].join('\n');
  function injectCss() {
    if (typeof document === 'undefined' || document.getElementById('tkp-mascot-css')) return;
    var s = document.createElement('style'); s.id = 'tkp-mascot-css'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function eye(cx, id, k) {
    return '<g class="m-eye' + (k ? ' m-eye2' : '') + '">' +
      '<circle cx="' + cx + '" cy="70" r="17.5" fill="#dff7fd"/>' +
      '<circle class="m-glow" cx="' + cx + '" cy="70" r="16" fill="none" stroke="#22d3ee" stroke-width="3.2" filter="url(#gl' + id + ')"/>' +
      '<circle cx="' + cx + '" cy="70" r="14.2" fill="url(#ey' + id + ')"/>' +
      '<g class="m-eyeball"><circle class="m-iris" cx="' + cx + '" cy="71" r="7.2" fill="url(#ir' + id + ')"/>' +
      '<circle cx="' + (cx - 5) + '" cy="64" r="4.2" fill="#fff"/><circle cx="' + (cx + 5) + '" cy="76" r="1.9" fill="#fff" opacity=".9"/></g>' +
      '<path class="m-happy" d="M' + (cx - 8) + ' 73 Q' + cx + ' 63 ' + (cx + 8) + ' 73" stroke="#7dd3fc" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
      '</g>';
  }

  function svg(logo, cls) {
    injectCss();
    logo = esc(logo || 'assets/logo.png');
    var id = 'm' + (++n) + Math.random().toString(36).slice(2, 6);
    var W = 'url(#wh' + id + ')';
    return '<svg class="mascot ' + esc(cls || '') + '" viewBox="0 0 160 190" width="100%" height="100%" role="img" aria-label="น้องAIเทศกิจพัทยา">' +
      '<defs>' +
        '<radialGradient id="wh' + id + '" cx="36%" cy="28%" r="78%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef3f8"/><stop offset=".85" stop-color="#cfd9e5"/><stop offset="1" stop-color="#aebdcf"/></radialGradient>' +
        '<radialGradient id="ey' + id + '" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#1d3b7a"/><stop offset=".6" stop-color="#0b1730"/><stop offset="1" stop-color="#030712"/></radialGradient>' +
        '<radialGradient id="ir' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#a5f3fc"/><stop offset=".45" stop-color="#38bdf8"/><stop offset="1" stop-color="#1e40af" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="mt' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#8a9bb2"/></linearGradient>' +
        '<radialGradient id="sh' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#22d3ee" stop-opacity=".55"/><stop offset=".55" stop-color="#0891b2" stop-opacity=".22"/><stop offset="1" stop-color="#0891b2" stop-opacity="0"/></radialGradient>' +
        '<filter id="gl' + id + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
        '<filter id="sf' + id + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>' +
      '</defs>' +
      '<ellipse class="m-shadow" cx="80" cy="184" rx="38" ry="6" fill="url(#sh' + id + ')"/>' +
      '<g class="m-bob">' +
        // legs + feet
        '<rect x="62" y="150" width="15" height="24" rx="7.5" fill="url(#mt' + id + ')"/><rect x="83" y="150" width="15" height="24" rx="7.5" fill="url(#mt' + id + ')"/>' +
        '<path d="M56 182 Q55 170 69.5 169 Q83 170 82 182 Z" fill="' + W + '" stroke="#b8c5d6" stroke-width=".8"/>' +
        '<path d="M78 182 Q77 170 90.5 169 Q105 170 104 182 Z" fill="' + W + '" stroke="#b8c5d6" stroke-width=".8"/>' +
        '<path class="m-glow" d="M58 181.5 H80 M80 181.5 H102" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" filter="url(#gl' + id + ')"/>' +
        // resting arm (right side of image)
        '<g class="m-arm2"><circle cx="113" cy="121" r="8.5" fill="url(#mt' + id + ')"/>' +
          '<path d="M114 124 Q121 136 122 146" stroke="#e9eef5" stroke-width="12" stroke-linecap="round" fill="none"/>' +
          '<path d="M114 124 Q121 136 122 146" stroke="#ffffff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7" transform="translate(-1.5 -1)"/>' +
          '<circle class="m-glow" cx="122" cy="148" r="6.4" fill="none" stroke="#22d3ee" stroke-width="2" filter="url(#gl' + id + ')"/>' +
          '<circle cx="122.5" cy="152.5" r="7.2" fill="' + W + '" stroke="#b8c5d6" stroke-width=".8"/></g>' +
        // torso
        '<path d="M50 118 Q50 107 80 107 Q110 107 110 118 L111 145 Q111 161 80 161 Q49 161 49 145 Z" fill="' + W + '" stroke="#b8c5d6" stroke-width=".9"/>' +
        '<path d="M56 150 Q80 160 104 150" stroke="#22d3ee" stroke-width="1.6" fill="none" class="m-glow" filter="url(#gl' + id + ')"/>' +
        '<ellipse cx="64" cy="118" rx="9" ry="4" fill="#fff" opacity=".9" filter="url(#sf' + id + ')"/>' +
        // chest badge with official logo
        '<circle cx="80" cy="133" r="19" fill="#0b1f3a"/>' +
        '<circle class="m-glow" cx="80" cy="133" r="19" fill="none" stroke="#22d3ee" stroke-width="2.6" filter="url(#gl' + id + ')"/>' +
        '<circle cx="80" cy="133" r="16.2" fill="#f8fbff"/>' +
        '<image href="' + logo + '" x="66" y="117.5" width="28" height="31" preserveAspectRatio="xMidYMid meet"/>' +
        // head group
        '<g class="m-head">' +
          '<rect x="72" y="100" width="16" height="10" rx="4" fill="url(#mt' + id + ')"/>' +
          // ear pieces
          '<ellipse cx="27.5" cy="66" rx="10" ry="16" fill="url(#mt' + id + ')"/><ellipse cx="132.5" cy="66" rx="10" ry="16" fill="url(#mt' + id + ')"/>' +
          '<ellipse class="m-glow" cx="25.5" cy="66" rx="5" ry="10" fill="none" stroke="#22d3ee" stroke-width="2.4" filter="url(#gl' + id + ')"/>' +
          '<ellipse class="m-glow" cx="134.5" cy="66" rx="5" ry="10" fill="none" stroke="#22d3ee" stroke-width="2.4" filter="url(#gl' + id + ')"/>' +
          // head shell
          '<ellipse cx="80" cy="62" rx="51" ry="45" fill="' + W + '" stroke="#b8c5d6" stroke-width=".9"/>' +
          // face plate
          '<path d="M38 70 Q38 44 80 44 Q122 44 122 70 Q122 98 80 98 Q38 98 38 70 Z" fill="#fbfdff" stroke="#d6e0eb" stroke-width="1"/>' +
          // headband
          '<path d="M29 54 Q34 12 80 11 Q126 12 131 54" stroke="url(#mt' + id + ')" stroke-width="7" fill="none" stroke-linecap="round"/>' +
          '<path d="M33 50 Q38 17 80 16" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>' +
          '<circle class="m-glow" cx="80" cy="11" r="3.4" fill="#67e8f9" filter="url(#gl' + id + ')"/>' +
          // gloss highlight
          '<ellipse cx="58" cy="30" rx="15" ry="6.5" fill="#fff" opacity=".95" transform="rotate(-18 58 30)" filter="url(#sf' + id + ')"/>' +
          eye(60, id, 0) + eye(100, id, 1) +
          '<ellipse cx="45" cy="86" rx="6" ry="3.4" fill="#fda4af" opacity=".5"/><ellipse cx="115" cy="86" rx="6" ry="3.4" fill="#fda4af" opacity=".5"/>' +
          '<path class="m-smile" d="M74 88 Q80 93.5 86 88" stroke="#1e293b" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
          '<g class="m-talk"><ellipse cx="80" cy="90.5" rx="5" ry="4.2" fill="#0f172a"/><ellipse cx="80" cy="92.6" rx="3" ry="1.5" fill="#22d3ee" opacity=".85"/></g>' +
        '</g>' +
        // waving arm (left side of image)
        '<g class="m-arm"><circle cx="47" cy="121" r="8.5" fill="url(#mt' + id + ')"/>' +
          '<path d="M45 119 Q30 112 21 99" stroke="#e9eef5" stroke-width="12" stroke-linecap="round" fill="none"/>' +
          '<path d="M45 119 Q30 112 21 99" stroke="#ffffff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7" transform="translate(1 -1.5)"/>' +
          '<ellipse class="m-glow" cx="20" cy="96" rx="7" ry="2.6" fill="none" stroke="#22d3ee" stroke-width="2" filter="url(#gl' + id + ')" transform="rotate(-30 20 96)"/>' +
          '<g fill="' + W + '" stroke="#b8c5d6" stroke-width=".8" transform="translate(-11 5) rotate(-12 28 84)">' +
            '<rect x="16" y="68" width="5.6" height="13" rx="2.8" transform="rotate(-22 19 80)"/>' +
            '<rect x="22.5" y="64" width="5.6" height="14" rx="2.8" transform="rotate(-6 25 78)"/>' +
            '<rect x="29" y="65" width="5.6" height="13.5" rx="2.8" transform="rotate(10 31 78)"/>' +
            '<rect x="35" y="71" width="5.4" height="11" rx="2.7" transform="rotate(34 37 82)"/>' +
            '<ellipse cx="28" cy="84" rx="10" ry="8.5"/></g></g>' +
      '</g></svg>';
  }
  window.TKPMascot = { svg: svg, png: 'assets/mascot.png' };
})();
