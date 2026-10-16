// สร้างไฟล์ SVG แบบเดี่ยว (มีแอนิเมชันในตัว) จาก assets/mascot.js : node tools/make_mascot_svg.js officer|robot
const fs = require('fs'), path = require('path');
global.window = {};
require(path.join(__dirname, '..', 'assets', 'mascot.js'));
const style = process.argv[2] || 'officer';
let svg = window.TKPMascot.svg('logo.png', '', style).replace(/ width="100%" height="100%"/, ' width="320" height="380"');
svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace('<defs>', '<style>' + window.TKPMascot.css.replace(/#chatFab:hover \.mascot /g, '.mascot:hover ') + '</style><defs>');
const out = path.join(__dirname, '..', 'assets', style === 'officer' ? 'mascot-officer.svg' : 'mascot.svg');
fs.writeFileSync(out, '<?xml version="1.0" encoding="UTF-8"?>\n<!-- น้องAIเทศกิจพัทยา — มาสคอตต้นฉบับ (' + style + ') · ตราโล่อ้างอิง logo.png ในโฟลเดอร์เดียวกัน -->\n' + svg + '\n');
console.log(out, fs.statSync(out).size);
