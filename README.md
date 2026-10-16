# เว็บไซต์เทศกิจพัทยา (Pattaya City Law Enforcement)

เว็บไซต์สาธารณะสำหรับประชาชนและนักท่องเที่ยว + ระบบหลังบ้านสำหรับผู้ดูแล **คนเดียว** (ไม่มีระบบเจ้าหน้าที่/สมาชิก)

- หน้าเว็บ: `index.html` + `assets/app.js` (Tailwind CDN, ฟอนต์ Prompt/Sarabun) — เนื้อหาทั้งหมดโหลดจาก `data/content.json`
- หลังบ้าน: `/admin` — ล็อกอินด้วยรหัสผ่าน แก้ไข/เพิ่ม/ลบเนื้อหาทุกส่วน อัปโหลดรูป ดู/อัปเดต/ส่งออกเรื่องร้องเรียน
- แชทบอท **น้องอัศวิน**: `POST /api/chat` ตอบจากฐานความรู้แบบออฟไลน์ หรือใช้ LLM ถ้าตั้ง API key
- เซิร์ฟเวอร์: Node.js + Express ไฟล์เดียว (`server.js`), เก็บข้อมูลเป็นไฟล์ JSON ไม่ต้องมีฐานข้อมูล

## เริ่มใช้งานบนเครื่อง

ต้องมี Node.js 18 ขึ้นไป

```bash
npm install
cp .env.example .env          # แล้วแก้ ADMIN_PASSWORD และ SESSION_SECRET
npm start                     # http://localhost:3000  และหลังบ้าน http://localhost:3000/admin
```

> ต้องเปิดผ่านเซิร์ฟเวอร์ (ไม่ใช่ดับเบิลคลิก index.html) เพราะหน้าเว็บโหลดเนื้อหาจาก `/api/content`

### ตัวแปรใน `.env`

| ตัวแปร | ความหมาย |
|---|---|
| `PORT` | พอร์ต (ค่าเริ่มต้น 3000) |
| `ADMIN_PASSWORD` | รหัสผ่านผู้ดูแล (จะถูก hash ด้วย bcrypt ตอนเริ่มเซิร์ฟเวอร์) |
| `ADMIN_PASSWORD_HASH` | ใช้แทน `ADMIN_PASSWORD` ได้ — สร้างด้วย `npm run hash-password -- "รหัสผ่าน"` (แนะนำบน production) |
| `SESSION_SECRET` | ข้อความสุ่มยาว ๆ สำหรับเซ็นคุกกี้ล็อกอิน (เช่น `openssl rand -hex 32`) |
| `COOKIE_SECURE` | ตั้ง `1` เมื่อใช้งานผ่าน HTTPS |
| `AI_API_KEY` | (ไม่บังคับ) API key ของ LLM — ถ้าไม่ตั้ง บอทจะตอบแบบออฟไลน์ |
| `AI_BASE_URL` | endpoint แบบ OpenAI-compatible เช่น `https://api.openai.com/v1`, `https://api.x.ai/v1`, `https://generativelanguage.googleapis.com/v1beta/openai` |
| `AI_MODEL` | ชื่อโมเดล เช่น `gpt-4o-mini`, `grok-3-mini`, `gemini-2.0-flash` |
| `GOOGLE_MAPS_API_KEY` | (ไม่บังคับ) เปิด Maps JavaScript API (+ Map Tiles API ถ้าใช้ Photorealistic 3D) และจำกัดด้วย HTTP referrer — ใช้เมื่อ `traffic.googleMapsApiKey` ว่าง |
| `GOOGLE_MAPS_MAP_ID` | Map ID แบบ JavaScript · Vector ที่เปิด Tilt และ Rotation |

## โครงสร้างไฟล์

```
server.js            เซิร์ฟเวอร์ + API ทั้งหมด
chatbot.js           เอนจินแชทบอท TH/EN/中文/РУС (offline matcher + LLM) อ้างอิงแหล่งที่มา
assets/mascot.js     มาสคอตหุ่นยนต์น้องอัศวิน (SVG หลายเลเยอร์ + CSS animation ฝังในไฟล์)
assets/voice.js      เสียงพูด (speechSynthesis) + พูดเพื่อถาม (SpeechRecognition) ของน้องอัศวิน
tts.js               เสียงพูดฝั่งเซิร์ฟเวอร์ (ไม่บังคับ: OpenAI-compatible /audio/speech หรือ Google Cloud TTS)
assets/mascot-officer.svg/.png  มาสคอตหุ่นยนต์ชุดเจ้าหน้าที่เทศกิจ (ค่าเริ่มต้น · เลือกแบบหุ่นยนต์สีขาวได้ในหลังบ้าน `chatbot.mascotStyle`)
assets/mascot.png    ภาพนิ่งมาสคอต (พื้นโปร่งใส) ใช้เป็นอวาตาร์ในบับเบิลแชท · สร้างใหม่ด้วย python3 tools/make_mascot_png.py
tools/build_laws.py  สคริปต์สร้างหมวดกฎหมาย/FAQ/คำตอบบอทจากแหล่งราชการ (ตรวจสอบ 15 ต.ค. 2569)
tools/law_urls.json  ลิงก์แหล่งที่มาทางการที่ใช้
index.html           หน้าเว็บสาธารณะ (markup)
assets/app.js        สคริปต์หน้าเว็บ (render เนื้อหาจาก JSON, tracker, ฟอร์ม, แชท)
assets/traffic.js    แผนที่จราจร 3D (Google vector + TrafficLayer / MapLibre 3D / Leaflet)
assets/alerts.js     แจ้งเหตุบนถนนแบบเรียลไทม์ (SSE) ฝั่งหน้าเว็บ
assets/cctv.js       กล้อง CCTV บนแผนที่ 3D + แผงภาพสด
assets/sim.js        รถ 3 มิติภาพจำลอง (three.js) บนถนนจาก OSM
assets/roads-pattaya.geojson  เส้นถนนหลักพัทยา © OpenStreetMap contributors (ODbL)
assets/vendor/       Leaflet 1.9.4, MapLibre GL 4.7.1 (BSD), three.js r149 (MIT) — ไม่ต้องพึ่ง CDN
alerts.js            API แจ้งเหตุบนถนน (SSE, โหวต, หมดอายุ, ผู้ดูแล)
data/alerts.json     การแจ้งเหตุ (สร้างอัตโนมัติ) · uploads/alerts/ รูปแจ้งเหตุ (สาธารณะ)
assets/              โลโก้ ภาพ hero พระบรมฉายาลักษณ์ favicon
admin/index.html     หน้าหลังบ้าน (single-page, vanilla JS)
data/content.json    เนื้อหาเว็บทั้งหมด (แก้ผ่าน /admin หรือแก้ไฟล์ตรง ๆ ก็ได้)
data/submissions.json   เรื่องร้องเรียน (สร้างอัตโนมัติ — ไม่เปิดสาธารณะ)
data/complaint-photos/  รูปจากผู้ร้องเรียน (เฉพาะผู้ดูแลดูได้)
data/backups/        สำรอง content.json อัตโนมัติทุกครั้งที่บันทึก (เก็บ 30 ฉบับล่าสุด)
uploads/             รูปที่ผู้ดูแลอัปโหลด (สาธารณะ)
```

## API

| Method | Path | สิทธิ์ | หน้าที่ |
|---|---|---|---|
| GET | `/api/content` | สาธารณะ | เนื้อหาเว็บ |
| POST | `/api/complaints` | สาธารณะ (จำกัด 10 ครั้ง/ชม./IP) | ส่งเรื่องร้องเรียน (multipart: name, phone, category, description, location, photo) → `{id}` |
| GET | `/api/track/:id` | สาธารณะ | สถานะเรื่อง (ไม่ส่งข้อมูลส่วนบุคคล) |
| POST | `/api/chat` | สาธารณะ (จำกัด 20 ครั้ง/นาที/IP) | `{message, history}` → `{mode, reply}` |
| POST | `/api/login` / `/api/logout` | — | เข้า/ออกระบบ (จำกัด 8 ครั้ง/10 นาที) |
| PUT | `/api/content` | ผู้ดูแล | บันทึกเนื้อหาทั้งหมด |
| POST | `/api/upload` | ผู้ดูแล | อัปโหลดรูป (png/jpg/webp/gif ≤ 8 MB) → `{url}` |
| GET/PATCH/DELETE | `/api/complaints[/:id]` | ผู้ดูแล | ดู / เปลี่ยนสถานะ+หมายเหตุ / ลบ |
| GET | `/api/complaints.csv` | ผู้ดูแล | ส่งออก CSV (เปิดใน Excel ภาษาไทยได้) |
| GET | `/api/alerts` | สาธารณะ | การแจ้งเหตุที่ยังไม่หมดอายุ |
| GET | `/api/alerts/stream` | สาธารณะ | Server-Sent Events: `upsert` / `remove` (หน้าเว็บสำรองด้วย polling 15 วินาที) |
| POST | `/api/alerts` | สาธารณะ (5 ครั้ง/10 นาที/IP + honeypot + ตรวจขอบเขตพื้นที่) | multipart: type, lat, lng, note, photo |
| POST | `/api/alerts/:id/vote` | สาธารณะ (1 ครั้ง/เหตุ/IP) | `{vote:"up"\|"down"}` 👍 ต่ออายุ · 👎 ครบเกณฑ์ = หมดอายุ |
| GET/POST/PATCH/DELETE | `/api/admin/alerts[/:id]` | ผู้ดูแล | ดู/เพิ่มประกาศทางการ/แก้/ปักหมุด/ลบ · `POST /api/admin/alerts/demo` เพิ่มตัวอย่าง · `DELETE /api/admin/alerts?examples=1` ลบตัวอย่างทั้งหมด |
| GET | `/api/chat/system-prompt`, `/api/chat/mode` | ผู้ดูแล | ดู system prompt และโหมดบอท |

สถานะเรื่อง: `received` (รับเรื่อง) → `in_progress` (กำลังดำเนินการ) → `done` (เสร็จสิ้น)

## แชทบอท น้องอัศวิน

- **หลายภาษา:** ไทย / English / 中文 / Русский — ตรวจภาษาจากตัวอักษรที่พิมพ์ ถ้าไม่ชัดเจนใช้ภาษาที่เลือกจากปุ่มภาษาบนหัวเว็บ (จำไว้ใน `localStorage.tkpLang`; ครั้งแรกเดาจากภาษาเบราว์เซอร์) คำทักทาย/ปุ่มลัด/ข้อความระบบเปลี่ยนตามภาษา (`chatbot.greetings`, `quickRepliesI18n`, `fallbackI18n`) คำตอบ KB มี `a`/`aEn`/`aZh`/`aRu`
- **ตอบจากแหล่งที่เชื่อถือได้เท่านั้น:** โหมดออฟไลน์ (ค่าเริ่มต้น) จับคู่กับ `chatbot.kb` + `faq` + **`laws.items`** (ทุกข้อมีชื่อกฎหมาย/มาตรา อัตราสูงสุด และ URL ราชการ) คำถามเรื่องกฎหมาย/ค่าปรับจะแนบลิงก์แหล่งที่มาทุกครั้ง ถ้าไม่พบคำตอบที่มั่นใจ จะ **ไม่เดา** แต่ตอบว่าไม่มีข้อมูลที่ยืนยันได้ พร้อมลิงก์ห้องสมุดกฎหมายเมืองพัทยา/pattaya.go.th
- **โหมด LLM:** ตั้ง `AI_API_KEY` (+ `AI_BASE_URL`, `AI_MODEL`) — system prompt สร้างจาก content.json (ข้อมูลหน่วยงาน FAQ กฎหมาย + รายการแหล่งที่มา [S#]) และสั่งให้ใช้เฉพาะฐานความรู้ ตอบในภาษาของผู้ใช้ และแนบ URL แหล่งที่มา; ถ้าคำตอบ LLM ไม่มีลิงก์แต่คำถามตรงกับกฎหมายในฐานข้อมูล เซิร์ฟเวอร์จะแนบลิงก์ทางการให้อัตโนมัติ · key อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น · LLM ล้มเหลว → กลับไปตอบแบบออฟไลน์
- **มาสคอต:** ค่าเริ่มต้นคือหุ่นยนต์ชุดเจ้าหน้าที่เทศกิจ (หมวก/ชุดกรมท่าขลิบทอง ตราโล่ที่หน้าหมวก วันทยหัตถ์เมื่อเปิดแชท) · เลือก “หุ่นยนต์” ได้ที่ `/admin` → เลย์เอาต์/เปิด-ปิด → แบบมาสคอต (`chatbot.mascotStyle`: `officer` | `robot`) · แบบหุ่นยนต์: หุ่นยนต์ชิบิสีขาวเงาออกแบบต้นฉบับ (หัวกลมโต ตาโตสีเข้มขอบฟ้าเรืองแสง หูฟัง ไฟสีฟ้า cyan) มีตราโล่เทศกิจพัทยาจริงจาก `site.logo` ที่หน้าอก วาดเป็น SVG หลายเลเยอร์ + CSS ไม่ใช้ไลบรารี/ภาพสต็อก: ลอยขึ้นลง กะพริบตา เอียงหัว ไฟอก/ตาเรืองแสงเป็นจังหวะ โบกมือเมื่อเปิดแชท ขยับปาก+ตาเต้นขณะตอบ เอาเมาส์ชี้ = โบกมือ เอียงหัว ตายิ้ม · เคารพ `prefers-reduced-motion` · ปิดมาสคอตได้ที่ `/admin` → เลย์เอาต์/เปิด-ปิด (จะใช้ `chatbot.avatar` ที่อัปโหลดเองแทน)
- แก้ชื่อบอท คำทักทาย ปุ่มลัด ฐานความรู้ และ system prompt ได้ที่ `/admin` → เนื้อหาเว็บไซต์ → แชทบอท · ทดลองถามได้ที่แท็บ "แชทบอท"

## น้องอัศวิน พูดได้ 🔊 / ฟังได้ 🎤

- **บุคลิก:** เด็กผู้ชายสุภาพ อ่อนโยน น่ารัก ภาษาไทยลงท้ายด้วย **“ฮะ”** (แก้คำลงท้ายได้ที่ `/admin` → เลย์เอาต์/เปิด-ปิด → เสียงพูด หรือ `chatbot.particle`) ใช้ทั้งคำตอบออฟไลน์ คำทักทาย ข้อความระบบ และสั่งใน system prompt ของโหมด LLM · `tools/apply_persona.py` ปรับข้อความใน content.json ให้ (build_laws.py เรียกอัตโนมัติ)
- **เสียงพูด (ฟรี ไม่ต้องใช้กุญแจ):** ใช้ Web Speech API `speechSynthesis` ของเบราว์เซอร์ เลือกเสียงตามภาษาคำตอบ (th-TH / en-US / zh-CN / ru-RU) ชอบเสียงผู้ชาย (เช่น Microsoft Niwat/Pattara บน Windows/Edge) ถ้าเครื่องมีแต่เสียงผู้หญิงจะลด pitch ≈0.88 และความเร็ว ≈0.95 ให้นุ่มแบบเด็กผู้ชาย · ตัด URL/markdown/อีโมจิก่อนอ่าน และอ่านคำย่อ พ.ร.บ./ม./พ.ศ. เป็นคำเต็ม · แบ่งประโยคยาวเป็นช่วง ๆ (กันบั๊กเสียงขาดของ Chrome)
- **ปุ่ม:** 🔊/🔇 บนหัวแชท (จำค่าใน `localStorage.tkpVoice`, ค่าเริ่มต้นเปิด) · ปุ่มฟังซ้ำในทุกข้อความของบอท · ปากและตามาสคอต (ทั้งแบบหุ่นยนต์และเจ้าหน้าที่) ขยับตามเหตุการณ์ start/boundary/end ของเสียง
- **ทักทายด้วยเสียง:** เมื่อผู้ใช้คลิกเปิดแชท (นับเป็น user gesture ตามกฎ autoplay) มาสคอตโบกมือ/วันทยหัตถ์และพูด “สวัสดีฮะ น้องอัศวินยินดีต้อนรับสู่เทศกิจพัทยาฮะ” (แยก 4 ภาษา แก้ข้อความ/ปิดได้ในหลังบ้าน) · ตอนโหลดหน้าแรกจะมีบับเบิล “สวัสดีฮะ 👋” ข้างปุ่มแชท (แสดงผลอย่างเดียว ไม่มีเสียงจนกว่าจะคลิก)
- **พูดเพื่อถาม:** ปุ่มไมค์ใช้ `SpeechRecognition`/`webkitSpeechRecognition` (Chrome, Edge, Android, Safari) ภาษาเดียวกับที่เลือกบนเว็บ แสดงข้อความระหว่างฟังและส่งอัตโนมัติเมื่อพูดจบ · เบราว์เซอร์ที่ไม่รองรับ (เช่น Firefox) จะซ่อนปุ่ม · Chrome ส่งเสียงไปประมวลผลที่เซิร์ฟเวอร์ของผู้ให้บริการเบราว์เซอร์
- **เสียงฝั่งเซิร์ฟเวอร์ (ไม่บังคับ):** ตั้ง `TTS_PROVIDER=openai` (ใช้ `TTS_API_KEY` หรือ `AI_API_KEY`, เสียงผู้ชายเริ่มต้น `echo`) หรือ `TTS_PROVIDER=google` + `GOOGLE_TTS_API_KEY` → `POST /api/tts` คืนไฟล์ MP3 (มีแคช + rate limit) ถ้าเรียกไม่สำเร็จหน้าเว็บจะกลับไปใช้เสียงเบราว์เซอร์ · กุญแจอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น (ดู `.env.example`)
- **ข้อควรรู้เรื่องเสียงภาษาไทย:** ขึ้นกับอุปกรณ์ — Windows/Edge มีเสียง Microsoft (Niwat ผู้ชาย, Premwadee ผู้หญิง) · Android ใช้ Google ภาษาไทย (ต้องติดตั้งข้อมูลเสียงภาษาไทย) · iOS/macOS มี Kanya/Narisa (ผู้หญิง) · Linux/บางเบราว์เซอร์อาจไม่มีเสียงไทยเลย ระบบจะแจ้งผู้ใช้และไม่อ่านเป็นภาษาอื่น หากต้องการเสียงเหมือนกันทุกเครื่องให้เปิดเสียงฝั่งเซิร์ฟเวอร์
- ตั้งค่าในหลังบ้าน: เปิด/ปิดเสียง · ทักทายอัตโนมัติ · ปุ่มไมค์ · ใช้เสียงเซิร์ฟเวอร์ · เพศเสียง · ความเร็ว · pitch · คำลงท้าย · ข้อความทักทาย 4 ภาษา (มีปุ่ม ▶ ทดลองฟัง)

## กฎหมาย ข้อบัญญัติ และค่าปรับ (แหล่งข้อมูลทางราชการเท่านั้น)

- อยู่ใน `content.json → laws` : `items[]` = `{category, title, titleEn/Zh/Ru, summary, fine, fineAmount, legalRef, year, source, url, url2, keywords}` + `disclaimer`, `lastChecked`, `sources[]` — แสดงบนเว็บแยกหมวด พร้อมลิงก์แหล่งที่มาและข้อสงวนสิทธิ์
- กฎ: ใส่จำนวนเงินเฉพาะที่ตัวบททางการระบุ (อัตรา “ไม่เกิน”) ถ้ายืนยันไม่ได้ให้ใช้ `ดูรายละเอียดในแหล่งอ้างอิง` และเว้น `fineAmount` ว่าง · ห้ามใส่ตัวเลขสมมติ
- แหล่งหลัก: ห้องสมุดกฎหมาย พ.ร.บ. และข้อบัญญัติเมืองพัทยา (info.pattaya.go.th/DocLib8), สาระสำคัญ พ.ร.บ.รักษาความสะอาดฯ (parliament.go.th), พ.ร.บ.ว่าด้วยการปรับเป็นพินัย พ.ศ. 2565 (law.prd.go.th), พ.ร.บ.การสาธารณสุข (กรมอนามัย)
- แก้ไขได้ที่ `/admin` → เนื้อหาเว็บไซต์ → กฎหมาย/ค่าปรับ (บอทใช้ข้อมูลชุดเดียวกันทันที) หรือแก้ `tools/build_laws.py` แล้วรัน `python3 tools/build_laws.py`

## เลย์เอาต์หน้าแรก / เปิด-ปิดฟีเจอร์

- `/admin` → แท็บ **เลย์เอาต์ / เปิด-ปิด**: ลาก ☰ (หรือ ↑ ↓) เพื่อเรียงส่วนของหน้าแรก และสวิตช์เปิด/ปิดแต่ละส่วน (Hero, ถวายพระพร, บริการ, แผนที่จราจร, นักท่องเที่ยว, แจ้งเรื่อง/ติดตาม, สถิติ, ข่าว, กฎหมาย, FAQ) และฟีเจอร์ย่อย (CCTV, แจ้งเหตุบนถนน, รถ 3D จำลอง, แจ้งเรื่อง, ติดตามสถานะ, เกี่ยวกับเรา, แชทบอท, แถบเมนูมือถือ, มาสคอต)
- เก็บใน `content.json → sections: [{id, label, enabled, order}]` และ `features: {cctv, alerts, simulation, complaint, trackStatus, about, chatbot, mobileBar}` — หน้าเว็บอ่านค่านี้ตอนโหลด (ส่วนที่ปิดจะซ่อนพร้อมลิงก์เมนูที่ชี้ไป) · ปิดแชทบอทจะปิด `/api/chat` ด้วย · Hero ตรึงไว้บนสุดเสมอ
- เพิ่มส่วนใหม่: ใส่ `data-sec="<id>"` ให้ `<section>` ใน `index.html` แล้วเพิ่ม `[id, ชื่อ]` ใน `SEC_DEF` (admin) และ `SEC` ใน `tools/build_laws.py`

## แผนที่จราจร 3D · แจ้งเหตุบนถนน · กล้อง CCTV

- **มี Google Maps key** (`traffic.googleMapsApiKey` + `googleMapsMapId` หรือ env `GOOGLE_MAPS_API_KEY` / `GOOGLE_MAPS_MAP_ID`): แผนที่ vector เอียง 3D หมุนรอบอัตโนมัติ + ชั้นข้อมูลจราจรสด หมุดแจ้งเหตุ/กล้องเป็น AdvancedMarker
- **ไม่มี key:** แผนที่ 3 มิติด้วย MapLibre GL + OpenFreeMap (vector tiles ฟรี, ตึก 3D, เอียง/หมุนได้) แสดงเครดิต OpenFreeMap/OpenMapTiles/OpenStreetMap · ปุ่ม 🚦 สลับดู iframe จราจรของ Google · ถ้าเครื่องไม่รองรับ WebGL จะใช้ Leaflet + OSM แทน
- **โหมดแผนที่:** ปุ่ม 🗺️ แผนที่ / 🛰️ ดาวเทียม 3D / 🚦 จราจร — ไม่มี key: ดาวเทียมใช้ Esri World Imagery (แสดงเครดิต Esri) บน MapLibre พร้อมเอียง/ตึก 3D, จราจร = iframe ของ Google · มี key: roadmap / hybrid (เอียงได้) / roadmap + TrafficLayer และปุ่ม Photorealistic 3D (Map Tiles API)
- **รถ 3 มิติ (ภาพจำลอง):** `assets/sim.js` + three.js (vendor) วิ่งบนเส้นถนนจริงจาก OSM (`assets/roads-pattaya.geojson` ดึงครั้งเดียวผ่าน Overpass) ชิดซ้าย ทางเดียวตาม `oneway` ความเร็วตามช่วงเวลา (ชั่วโมงเร่งด่วนช้าลง) และชะลอ/ต่อคิวใกล้จุดแจ้งเหตุ กลางคืน (เวลาไทย) เปิดไฟหน้า · สูงสุด 150 คัน (มือถือ 60) หยุดเมื่อเลื่อนพ้นหรือสลับแท็บ ปิดอัตโนมัติถ้าผู้ใช้ตั้ง reduce motion · แสดงป้าย “ภาพจำลอง” เสมอ ปิด/เปิดด้วยปุ่ม 🚗 · ค่าเริ่มต้นตั้งที่ `traffic.simulation` · โหมด Google ต้องมี Map ID (WebGLOverlayView) และรถไม่แสดงในโหมด Photorealistic 3D
  - อัปเดตถนน: แก้ query ใน README นี้แล้วดึงใหม่จาก Overpass (โปรดใช้อย่างประหยัด) แปลงเป็น GeoJSON LineString ที่มี `name`, `highway`, `oneway`
- **แจ้งเหตุบนถนน:** ประเภท/อายุแสดงผล (ชั่วโมง)/เกณฑ์โหวต/ขนาดรูป/ขอบเขตพื้นที่ ตั้งค่าได้ที่ /admin → เนื้อหา → แจ้งเหตุบนถนน · จัดการรายการได้ที่แท็บ "แจ้งเหตุบนถนน" (ประกาศทางการ, ปักหมุด, ลบ, ข้อมูลตัวอย่างติดป้าย "ตัวอย่าง")
- **Nginx กับ SSE:** เซิร์ฟเวอร์ส่ง `X-Accel-Buffering: no` แล้ว แต่ถ้าใช้ proxy อื่นให้ปิด buffering และตั้ง `proxy_read_timeout 1h;`
- **กล้อง CCTV:** รายการกล้องแก้ได้ที่ /admin → เนื้อหา → กล้องสด CCTV (ชื่อ พิกัด ทิศกล้อง ชนิดสตรีม `link`/`hls`/`youtube`/`iframe`)
  - ระบบทางการ livestream.pattaya.go.th ใช้ WebRTC ที่สร้างลิงก์เล่นแบบใช้ครั้งเดียว ป้องกันด้วย Cloudflare Turnstile และตั้ง CSP `frame-ancestors` อนุญาตเฉพาะ `*.pattaya.go.th` — **จึงไม่ดึงสตรีมโดยตรงและไม่ข้ามระบบป้องกัน**: ค่าเริ่มต้นเป็นปุ่มเปิดเว็บไซต์ทางการ (แสดงเครดิตเมืองพัทยาเสมอ)
  - ถ้าเว็บนี้โฮสต์บนโดเมน `*.pattaya.go.th` และเปิด `allowOfficialEmbed` แผงภาพสดจะฝังหน้าเว็บทางการได้
  - ถ้าได้รับลิงก์ HLS (.m3u8, เปิด CORS) หรือ YouTube Live อย่างเป็นทางการ ใส่ใน `src` แล้วเลือกชนิด → เล่นในแผงลอยได้ทันที (hls.js โหลดเมื่อใช้)
  - พิกัดกล้องที่ให้มาเป็น **ตัวอย่าง/โดยประมาณ** ต้องแก้เป็นพิกัดจริงก่อนเผยแพร่

## Deploy ฟรีบน Render (เดโม)

1. push โค้ดขึ้น GitHub (มี `render.yaml` แล้ว)
2. เข้า https://dashboard.render.com ด้วยบัญชี GitHub → **New + → Blueprint** → เลือก repo นี้
3. กรอก `ADMIN_PASSWORD` (ค่าอื่นตั้งให้อัตโนมัติ: `SESSION_SECRET` สุ่ม, `COOKIE_SECURE=1`, `TRUST_PROXY=1`, `SEED_DEMO_ALERTS=1`) → Apply
4. รอ build เสร็จ จะได้ URL `https://tesakij-pattaya.onrender.com` (หรือชื่อใกล้เคียง) · หลังบ้านที่ `/admin`

> แพ็กเกจฟรี: เครื่องหลับเมื่อไม่มีผู้ใช้ ~15 นาที (เปิดครั้งแรกช้า ~30–60 วินาที) และดิสก์เป็นแบบชั่วคราว — การแก้เนื้อหา/เรื่องร้องเรียน/แจ้งเหตุจะหายเมื่อ deploy ใหม่หรือเครื่องรีสตาร์ต ถ้าใช้งานจริงให้เพิ่ม Persistent Disk (แพ็กเกจเสียเงิน) ที่ `data/` และ `uploads/`

## นำขึ้นใช้งานจริง (Deploy)

1. เซิร์ฟเวอร์ Linux ที่มี Node.js 18+ → คัดลอกโฟลเดอร์นี้ → `npm ci --omit=dev`
2. สร้าง `.env` (ใช้ `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` แบบสุ่ม, `COOKIE_SECURE=1`)
3. รันแบบถาวรด้วย pm2 (`pm2 start server.js --name tesakij && pm2 save`) หรือ systemd
4. วาง Nginx/Caddy ด้านหน้าเพื่อทำ HTTPS แล้ว proxy ไปที่ `127.0.0.1:3000` (Nginx: ตั้ง `client_max_body_size 12m;`)
5. **สำรองข้อมูล** โฟลเดอร์ `data/` และ `uploads/` เป็นประจำ

ตัวอย่าง Nginx:
```nginx
server {
  server_name example.go.th;
  client_max_body_size 12m;
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
}
```
> ถ้า proxy ไม่ได้อยู่เครื่องเดียวกัน ให้ปรับ `app.set('trust proxy', ...)` ใน server.js เพื่อให้ rate limit อ่าน IP ได้ถูกต้อง

## ต่อยอด

- เพิ่มฟิลด์ใหม่: เพิ่ม key ใน `data/content.json` → หลังบ้านสร้างช่องกรอกให้อัตโนมัติ (ตั้งชื่อภาษาไทยได้ที่ตัวแปร `L` ใน `admin/index.html`) → ใช้ในหน้าเว็บด้วย `data-bind="section.key"` หรือใน `assets/app.js`
- key ที่ลงท้ายด้วย `image`/`logo`/`avatar`/`qr` จะมีปุ่มอัปโหลดรูปให้อัตโนมัติ
- ภาษา EN/中文/РУС ในหน้าเว็บตอนนี้เป็นปุ่มแสดงผล — ต่อยอดได้โดยเพิ่ม `content.<lang>.json`

## ก่อนเผยแพร่จริง — ต้องแทนที่ข้อมูลตัวอย่าง

- จุดกล้อง CCTV ตัวอย่าง (ตำแหน่งโดยประมาณ) และการแจ้งเหตุตัวอย่าง (ลบได้ที่แท็บแจ้งเหตุ)
- เบอร์สายด่วน `0X-XXX-XXXX`, อีเมล, ที่อยู่, LINE ID / QR (ปิด "เบอร์ยังเป็นตัวอย่าง" ในหลังบ้านเมื่อใส่เบอร์จริง)
- ข่าวและสถิติที่มีป้าย "ตัวอย่าง" (กฎหมาย/ค่าปรับ/FAQ ใช้ข้อมูลจากแหล่งราชการแล้ว — ควรตรวจซ้ำเป็นระยะ และดูข้อบัญญัติเมืองพัทยาฉบับใหม่)
- ตรวจสอบเครดิต/สัญญาอนุญาตของภาพ (ดูคอมเมนต์ใน `index.html`)

## เครดิตภาพ

- ภาพ Hero: “DFC 4640 Pattaya lights sparkling at night…” โดย PattayaPatrol — CC BY-SA 4.0 — https://commons.wikimedia.org/wiki/File:DFC_4640_Pattaya_lights_sparkling_at_night_-_a_coastal_cityscape_shimmering_along_the_bay.jpg
- พระบรมฉายาลักษณ์: กรมประชาสัมพันธ์ — CC BY 3.0 TH — https://commons.wikimedia.org/wiki/File:King_Rama_X_official.png และ https://commons.wikimedia.org/wiki/File:Queen_Suthida_Official_Portrait.jpg (ครอบ/ย่อขนาดเท่านั้น)
- ตราสัญลักษณ์: จากหน่วยงาน
