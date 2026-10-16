/* น้องอัศวิน — มาสคอตหุ่นยนต์ต้นฉบับ (ออกแบบใหม่ทั้งหมด ไม่ได้ลอก/ตามรอยภาพใด) วาดด้วย SVG หลายเลเยอร์ + แอนิเมชัน CSS
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
    '.mascot .m-salute{transform-origin:47px 121px}',
    '.mascot.wave .m-salute,.mascot:hover .m-salute,#chatFab:hover .mascot .m-salute{animation:tmSalute 1.6s cubic-bezier(.3,1.4,.5,1) both}',
    '.mascot .m-whistle{transform-origin:96px 124px;animation:tmSway 3.6s ease-in-out infinite}',
    '@keyframes tmSalute{0%{transform:rotate(-62deg)}35%{transform:rotate(4deg)}50%{transform:rotate(-2deg)}62%,100%{transform:rotate(0)}}',
    '.mascot.say .m-talk{animation:none!important;transform:scaleY(1.25)}',
    '.mascot.say .m-iris{animation:none!important;transform:scale(1.22)}',
    '.mascot.say .m-glow{opacity:1}',
    '.mascot.listening .m-head{animation:tmListen 1.1s ease-in-out infinite alternate}',
    '.mascot.listening .m-glow{animation-duration:.8s}',
    '@keyframes tmListen{from{transform:rotate(-7deg)}to{transform:rotate(-3deg) translateY(-1px)}}',
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
    return '<svg class="mascot ' + esc(cls || '') + '" viewBox="0 0 160 190" width="100%" height="100%" role="img" aria-label="น้องอัศวิน">' +
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

  /* แบบที่ 2 (ตัวอย่าง): หุ่นยนต์ในชุดเจ้าหน้าที่เทศกิจ — หมวกทรงหม้อตาลสีกรมท่า ตราโล่ที่หน้าหมวก
     ปกเสื้อ/อินทรธนูขลิบทอง นกหวีด ท่าวันทยหัตถ์ (คลาส wave = ทำวันทยหัตถ์ใหม่) */
  function officer(logo, cls) {
    injectCss();
    logo = esc(logo || 'assets/logo.png');
    var id = 'o' + (++n) + Math.random().toString(36).slice(2, 6);
    var W = 'url(#wh' + id + ')', NV = 'url(#nv' + id + ')', GD = 'url(#gd' + id + ')', G = 'url(#gl' + id + ')';
    return '<svg class="mascot mascot-officer ' + esc(cls || '') + '" viewBox="0 0 160 190" width="100%" height="100%" role="img" aria-label="น้องอัศวิน (ชุดเจ้าหน้าที่)">' +
      '<defs>' +
        '<radialGradient id="wh' + id + '" cx="36%" cy="28%" r="78%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef3f8"/><stop offset=".85" stop-color="#cfd9e5"/><stop offset="1" stop-color="#aebdcf"/></radialGradient>' +
        '<linearGradient id="nv' + id + '" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#2c4f86"/><stop offset=".5" stop-color="#16325e"/><stop offset="1" stop-color="#0a1c3a"/></linearGradient>' +
        '<linearGradient id="gd' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".5" stop-color="#f5c518"/><stop offset="1" stop-color="#b8860b"/></linearGradient>' +
        '<linearGradient id="vi' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#334155"/><stop offset="1" stop-color="#020617"/></linearGradient>' +
        '<radialGradient id="ey' + id + '" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#1d3b7a"/><stop offset=".6" stop-color="#0b1730"/><stop offset="1" stop-color="#030712"/></radialGradient>' +
        '<radialGradient id="ir' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#a5f3fc"/><stop offset=".45" stop-color="#38bdf8"/><stop offset="1" stop-color="#1e40af" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="mt' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#8a9bb2"/></linearGradient>' +
        '<radialGradient id="sh' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#22d3ee" stop-opacity=".55"/><stop offset=".55" stop-color="#0891b2" stop-opacity=".22"/><stop offset="1" stop-color="#0891b2" stop-opacity="0"/></radialGradient>' +
        '<filter id="gl' + id + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
        '<filter id="sf' + id + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter>' +
      '</defs>' +
      '<ellipse class="m-shadow" cx="80" cy="184" rx="38" ry="6" fill="url(#sh' + id + ')"/>' +
      '<g class="m-bob">' +
        // trousers + shoes
        '<rect x="62" y="150" width="15" height="24" rx="6" fill="' + NV + '"/><rect x="83" y="150" width="15" height="24" rx="6" fill="' + NV + '"/>' +
        '<path d="M56 182 Q55 170 69.5 169 Q83 170 82 182 Z" fill="url(#vi' + id + ')"/><path d="M78 182 Q77 170 90.5 169 Q105 170 104 182 Z" fill="url(#vi' + id + ')"/>' +
        '<ellipse cx="64" cy="173" rx="5" ry="1.6" fill="#fff" opacity=".35"/><ellipse cx="86" cy="173" rx="5" ry="1.6" fill="#fff" opacity=".35"/>' +
        '<path class="m-glow" d="M58 181.5 H80 M80 181.5 H102" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" filter="' + G + '"/>' +
        // resting arm (navy sleeve, white robot hand)
        '<g class="m-arm2"><circle cx="113" cy="121" r="8.5" fill="' + NV + '"/>' +
          '<path d="M114 124 Q121 136 122 146" stroke="#1b3a6b" stroke-width="12" stroke-linecap="round" fill="none"/>' +
          '<path d="M116.5 141 L127.5 143" stroke="' + GD + '" stroke-width="2.2" stroke-linecap="round"/>' +
          '<circle cx="122.5" cy="152.5" r="7.2" fill="' + W + '" stroke="#b8c5d6" stroke-width=".8"/></g>' +
        // uniform torso
        '<path d="M50 118 Q50 107 80 107 Q110 107 110 118 L111 145 Q111 161 80 161 Q49 161 49 145 Z" fill="' + NV + '"/>' +
        '<path d="M80 110 V158" stroke="#0a1c3a" stroke-width="1.2" opacity=".6"/>' +
        '<circle cx="80" cy="124" r="1.6" fill="' + GD + '"/><circle cx="80" cy="136" r="1.6" fill="' + GD + '"/><circle cx="80" cy="148" r="1.6" fill="' + GD + '"/>' +
        // belt
        '<rect x="49.5" y="148" width="61" height="6" rx="2" fill="#0b1220"/><rect x="75" y="147.2" width="10" height="7.6" rx="1.6" fill="' + GD + '"/>' +
        '<path class="m-glow" d="M52 157.5 Q80 163 108 157.5" stroke="#22d3ee" stroke-width="1.5" fill="none" filter="' + G + '"/>' +
        // collar
        '<path d="M66 107 L80 121 L71 125 L61 111 Z" fill="#23457c" stroke="' + GD + '" stroke-width="1"/>' +
        '<path d="M94 107 L80 121 L89 125 L99 111 Z" fill="#23457c" stroke="' + GD + '" stroke-width="1"/>' +
        // epaulettes
        '<rect x="48" y="110" width="16" height="6" rx="3" fill="#0f2547" stroke="' + GD + '" stroke-width="1.2" transform="rotate(-14 56 113)"/>' +
        '<rect x="96" y="110" width="16" height="6" rx="3" fill="#0f2547" stroke="' + GD + '" stroke-width="1.2" transform="rotate(14 104 113)"/>' +
        '<circle cx="60" cy="112" r="1.3" fill="' + GD + '"/><circle cx="100" cy="112" r="1.3" fill="' + GD + '"/>' +
        // chest: gold name plate (left) + pocket with badge (right side of image)
        '<rect x="57" y="129" width="16" height="5" rx="1.2" fill="' + GD + '"/><path d="M59 131.5 H71" stroke="#7c5a00" stroke-width=".9"/>' +
        '<path d="M88 128 H103 V138 Q95.5 141 88 138 Z" fill="#1b3a6b" stroke="#0a1c3a" stroke-width=".6"/>' +
        '<path d="M95.5 119.5 l4 1.8 v3.6 q0 3.6 -4 5.4 q-4 -1.8 -4 -5.4 v-3.6 Z" fill="' + GD + '" stroke="#8a6400" stroke-width=".6"/>' +
        // whistle on cord
        '<g class="m-whistle"><path d="M71 112 Q84 128 96 124" stroke="#f5c518" stroke-width="1.2" fill="none"/>' +
          '<rect x="94" y="121" width="10" height="5.5" rx="2.7" fill="url(#mt' + id + ')" stroke="#64748b" stroke-width=".5"/><circle cx="99" cy="123.8" r="1.3" fill="#334155"/></g>' +
        // head group
        '<g class="m-head">' +
          '<rect x="72" y="100" width="16" height="10" rx="4" fill="url(#mt' + id + ')"/>' +
          '<ellipse cx="27.5" cy="68" rx="10" ry="15" fill="url(#mt' + id + ')"/><ellipse cx="132.5" cy="68" rx="10" ry="15" fill="url(#mt' + id + ')"/>' +
          '<ellipse class="m-glow" cx="25.5" cy="68" rx="5" ry="9" fill="none" stroke="#22d3ee" stroke-width="2.4" filter="' + G + '"/>' +
          '<ellipse class="m-glow" cx="134.5" cy="68" rx="5" ry="9" fill="none" stroke="#22d3ee" stroke-width="2.4" filter="' + G + '"/>' +
          '<ellipse cx="80" cy="64" rx="51" ry="43" fill="' + W + '" stroke="#b8c5d6" stroke-width=".9"/>' +
          '<path d="M38 72 Q38 50 80 50 Q122 50 122 72 Q122 99 80 99 Q38 99 38 72 Z" fill="#fbfdff" stroke="#d6e0eb" stroke-width="1"/>' +
          eye(60, id, 0).replace(/cy="70"/g, 'cy="74"').replace(/cy="71"/g, 'cy="75"').replace(/cy="64"/g, 'cy="68"').replace(/cy="76"/g, 'cy="80"').replace(/ 73 Q/, ' 77 Q').replace(/ 63 /, ' 67 ').replace(/ 73"/, ' 77"') +
          eye(100, id, 1).replace(/cy="70"/g, 'cy="74"').replace(/cy="71"/g, 'cy="75"').replace(/cy="64"/g, 'cy="68"').replace(/cy="76"/g, 'cy="80"').replace(/ 73 Q/, ' 77 Q').replace(/ 63 /, ' 67 ').replace(/ 73"/, ' 77"') +
          '<ellipse cx="45" cy="89" rx="6" ry="3.2" fill="#fda4af" opacity=".5"/><ellipse cx="115" cy="89" rx="6" ry="3.2" fill="#fda4af" opacity=".5"/>' +
          '<path class="m-smile" d="M74 91 Q80 96 86 91" stroke="#1e293b" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
          '<g class="m-talk"><ellipse cx="80" cy="93" rx="5" ry="4" fill="#0f172a"/><ellipse cx="80" cy="95" rx="3" ry="1.4" fill="#22d3ee" opacity=".85"/></g>' +
          // officer peaked cap
          '<path d="M33 44 Q22 24 40 15 Q80 -2 120 15 Q138 24 127 44 Z" fill="' + NV + '"/>' +
          '<path d="M40 15 Q80 -2 120 15" stroke="' + GD + '" stroke-width="1.4" fill="none" opacity=".8"/>' +
          '<ellipse cx="62" cy="15" rx="16" ry="4" fill="#fff" opacity=".22" transform="rotate(-8 62 15)" filter="url(#sf' + id + ')"/>' +
          '<rect x="32" y="37" width="96" height="10" rx="3" fill="#0b1a33"/>' +
          '<rect x="32" y="40" width="96" height="3.4" rx="1.5" fill="' + GD + '"/>' +
          '<path d="M33 46 Q80 60 127 46 Q121 55 80 56.5 Q39 55 33 46 Z" fill="url(#vi' + id + ')"/>' +
          '<path d="M44 51 Q80 58 116 51" stroke="#fff" stroke-width="1" fill="none" opacity=".35"/>' +
          '<circle cx="34" cy="42" r="2.2" fill="' + GD + '"/><circle cx="126" cy="42" r="2.2" fill="' + GD + '"/>' +
          // cap emblem: official shield on gold wreath
          '<path d="M64 33 Q60 20 70 12 M96 33 Q100 20 90 12" stroke="' + GD + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
          '<image href="' + logo + '" x="68.5" y="9" width="23" height="26" preserveAspectRatio="xMidYMid meet"/>' +
        '</g>' +
        // saluting arm (left side of image) — in front
        '<g class="m-salute"><circle cx="47" cy="121" r="8.5" fill="' + NV + '"/>' +
          '<path d="M45 119 Q22 104 26 78" stroke="#1b3a6b" stroke-width="12" stroke-linecap="round" fill="none"/>' +
          '<path d="M43 116 Q24 104 27 82" stroke="#3b62a0" stroke-width="3.5" stroke-linecap="round" fill="none" opacity=".55"/>' +
          '<path d="M20 83 L32 85" stroke="' + GD + '" stroke-width="2.2" stroke-linecap="round"/>' +
          '<g fill="' + W + '" stroke="#b8c5d6" stroke-width=".8" transform="translate(-4 -3) rotate(40 30 64)">' +
            '<rect x="23" y="49" width="14" height="24" rx="7"/><path d="M24.5 54 H35.5 M24.5 59 H35.5 M24.5 64 H35.5" stroke="#cbd5e1" stroke-width=".8"/>' +
          '</g></g>' +
      '</g></svg>';
  }
  function render(logo, cls, style) { return style === 'officer' ? officer(logo, cls) : svg(logo, cls); }
  window.TKPMascot = { css: CSS, svg: render, robot: svg, officer: officer, png: 'assets/mascot.png', pngOfficer: 'assets/mascot-officer.png' };
})();
