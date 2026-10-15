/* น้องAIเทศกิจพัทยา — มาสคอตต้นฉบับ (ออกแบบใหม่ ไม่ได้ลอกตัวละครของแบรนด์ใด) วาดด้วย SVG + แอนิเมชัน CSS
 * TKPMascot.svg(logoUrl, extraClass) → string   คลาส: wave (โบกมือ) · talking (ขยับปาก) · static (ไม่ลอยขึ้นลง)
 * ตัวละครสวมหมวกเจ้าหน้าที่ ใส่หูฟังผู้ช่วย AI และถือโล่ตราเทศกิจพัทยา (ภาพตราจริงจาก site.logo) */
(function () {
  'use strict';
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function svg(logo, cls) {
    logo = esc(logo || 'assets/logo.png');
    return '<svg class="mascot ' + esc(cls || '') + '" viewBox="0 0 120 140" width="100%" height="100%" role="img" aria-label="น้องAIเทศกิจพัทยา">' +
      '<ellipse class="m-shadow" cx="60" cy="135" rx="30" ry="4.5" fill="#050f1f" opacity=".25"/>' +
      '<g class="m-bob">' +
        // body (uniform)
        '<path d="M28 134 Q26 100 60 95 Q94 100 92 134 Z" fill="#13315C"/>' +
        '<path d="M48 97 L60 110 L72 97 Z" fill="#fff"/><path d="M57 104 h6 l-1.5 10 h-3 Z" fill="#F5C518"/>' +
        '<path d="M28 120 Q28 106 36 102" stroke="#F5C518" stroke-width="2" fill="none" opacity=".7"/>' +
        // right arm (waving)
        '<g class="m-arm"><path d="M90 104 Q104 92 106 76" stroke="#13315C" stroke-width="11" stroke-linecap="round" fill="none"/>' +
          '<circle cx="106" cy="71" r="7.5" fill="#FFD7B5"/><path d="M101 66 q2-5 5-1 M105 64 q2-5 5 0" stroke="#e8b48f" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>' +
        // shield (official logo) held at chest + left hand
        '<image href="' + logo + '" x="34" y="92" width="46" height="48" preserveAspectRatio="xMidYMid meet"/>' +
        '<path d="M30 112 Q30 122 38 124" stroke="#13315C" stroke-width="10" stroke-linecap="round" fill="none"/>' +
        '<circle cx="40" cy="123" r="6.5" fill="#FFD7B5"/>' +
        // head
        '<circle cx="27" cy="60" r="6" fill="#FFD7B5"/><circle cx="93" cy="60" r="6" fill="#FFD7B5"/>' +
        '<circle cx="60" cy="58" r="33" fill="#FFE1C6"/>' +
        '<path d="M30 50 Q34 38 48 40 Q44 46 46 50 Q54 42 62 44 Q60 48 64 50 Q74 42 88 48 Q90 52 90 54 Q76 48 60 50 Q42 48 30 54 Z" fill="#1e293b"/>' +
        // cap
        '<path d="M23 44 Q24 13 60 11 Q96 13 97 44 Z" fill="#0B2545"/>' +
        '<rect x="23" y="37" width="74" height="8" rx="3" fill="#F5C518"/>' +
        '<path d="M25 45 Q60 57 95 45 Q60 50 25 45 Z" fill="#050f1f"/>' +
        '<path d="M60 18 l6 3 v6 q0 6 -6 9 q-6 -3 -6 -9 v-6 Z" fill="#F5C518" stroke="#8F6B00" stroke-width="1"/>' +
        '<path d="M57.5 25.5 l2 2 l3.5 -4" stroke="#0B2545" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        // eyes (blink)
        '<g class="m-eye"><ellipse cx="47" cy="61" rx="4.8" ry="6.2" fill="#0B2545"/><circle cx="48.8" cy="58.4" r="1.8" fill="#fff"/></g>' +
        '<g class="m-eye"><ellipse cx="73" cy="61" rx="4.8" ry="6.2" fill="#0B2545"/><circle cx="74.8" cy="58.4" r="1.8" fill="#fff"/></g>' +
        '<ellipse cx="37" cy="71" rx="5" ry="3" fill="#FF8FA3" opacity=".6"/><ellipse cx="83" cy="71" rx="5" ry="3" fill="#FF8FA3" opacity=".6"/>' +
        // mouth: smile + talking
        '<path class="m-smile" d="M52.5 72 Q60 80 67.5 72" stroke="#0B2545" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<g class="m-talk"><ellipse cx="60" cy="75" rx="6" ry="5" fill="#7a1f2b"/><ellipse cx="60" cy="77.5" rx="3.6" ry="2" fill="#ff8a8a"/></g>' +
        // AI headset (sky blue)
        '<path d="M93 54 Q99 60 95 68 Q88 78 76 79" stroke="#38bdf8" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<circle cx="75" cy="79" r="3" fill="#38bdf8"/><rect x="90" y="52" width="7" height="12" rx="3.5" fill="#0ea5e9"/>' +
        '<path d="M103 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" fill="#F5C518"/>' +
      '</g></svg>';
  }
  window.TKPMascot = { svg: svg };
})();
