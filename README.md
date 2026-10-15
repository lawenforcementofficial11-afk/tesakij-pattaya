# เว็บไซต์เทศกิจพัทยา (Pattaya City Law Enforcement)

เว็บไซต์สาธารณะสำหรับประชาชนและนักท่องเที่ยว + ระบบหลังบ้านสำหรับผู้ดูแล **คนเดียว** (ไม่มีระบบเจ้าหน้าที่/สมาชิก)

- หน้าเว็บ: `index.html` + `assets/app.js` (Tailwind CDN, ฟอนต์ Prompt/Sarabun) — เนื้อหาทั้งหมดโหลดจาก `data/content.json`
- หลังบ้าน: `/admin` — ล็อกอินด้วยรหัสผ่าน แก้ไข/เพิ่ม/ลบเนื้อหาทุกส่วน อัปโหลดรูป ดู/อัปเดต/ส่งออกเรื่องร้องเรียน
- แชทบอท **น้องAIเทศกิจพัทยา**: `POST /api/chat` ตอบจากฐานความรู้แบบออฟไลน์ หรือใช้ LLM ถ้าตั้ง API key
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
chatbot.js           เอนจินแชทบอท (offline matcher + LLM)
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

## แชทบอท น้องAIเทศกิจพัทยา

- **โหมดออฟไลน์ (ค่าเริ่มต้น):** จับคู่คำถามกับ `chatbot.kb` (คำสำคัญ + ความคล้ายของข้อความ) และ `faq` ใน content.json ตอบภาษาไทยหรืออังกฤษตามภาษาที่ถาม ถ้าไม่พบจะใช้ข้อความ `fallback`
- **โหมด LLM:** ตั้ง `AI_API_KEY` (+ `AI_BASE_URL`, `AI_MODEL`) เซิร์ฟเวอร์จะสร้าง system prompt จาก `chatbot.systemPrompt` + ข้อมูลหน่วยงาน/FAQ/ค่าปรับ แล้วเรียก `/chat/completions` — key อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น ถ้า LLM ล้มเหลวจะกลับไปตอบแบบออฟไลน์อัตโนมัติ
- แก้ชื่อบอท คำทักทาย ปุ่มตอบด่วน ฐานความรู้ และ system prompt ได้ที่ `/admin` → เนื้อหาเว็บไซต์ → แชทบอท และทดลองถามได้ที่แท็บ "แชทบอท"

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
- ข่าว สถิติ ค่าปรับ และ FAQ ที่มีป้าย "ตัวอย่าง"
- ตรวจสอบเครดิต/สัญญาอนุญาตของภาพ (ดูคอมเมนต์ใน `index.html`)

## เครดิตภาพ

- ภาพ Hero: “DFC 4640 Pattaya lights sparkling at night…” โดย PattayaPatrol — CC BY-SA 4.0 — https://commons.wikimedia.org/wiki/File:DFC_4640_Pattaya_lights_sparkling_at_night_-_a_coastal_cityscape_shimmering_along_the_bay.jpg
- พระบรมฉายาลักษณ์: กรมประชาสัมพันธ์ — CC BY 3.0 TH — https://commons.wikimedia.org/wiki/File:King_Rama_X_official.png และ https://commons.wikimedia.org/wiki/File:Queen_Suthida_Official_Portrait.jpg (ครอบ/ย่อขนาดเท่านั้น)
- ตราสัญลักษณ์: จากหน่วยงาน
