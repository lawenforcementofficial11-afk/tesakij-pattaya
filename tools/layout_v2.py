"""Layout v2 (ตัวอย่าง): ตัด สภาพการจราจร/จราจรสด(CCTV, แจ้งเหตุบนถนน, รถจำลอง) · ขออนุญาตตั้งวางสินค้า · Tourist Help ออกจากหน้าเว็บ
ปรับ content.json ให้สอดคล้อง (idempotent) — python3 tools/layout_v2.py"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'data', 'content.json')
c = json.load(open(P, encoding='utf-8'))
REMOVED_SECS = {'traffic', 'tourist'}
# บริการ: ตัดการ์ดขออนุญาตตั้งวางสินค้า + เพิ่มการ์ด "คุยกับน้องอัศวิน" ให้กริดสมดุล 3×2
svc = [s for s in c.get('services', []) if 'ขออนุญาตตั้งวางสินค้า' not in s.get('title', '')]
if not any(s.get('link') == '#chat' for s in svc):
    svc.insert(2, {'icon': 'chat', 'title': 'ถามน้องอัศวิน 24 ชม.', 'desc': 'ผู้ช่วย AI ตอบเรื่องข้อบัญญัติ ค่าปรับ และการแจ้งเรื่อง พร้อมลิงก์แหล่งข้อมูลทางราชการ', 'link': '#chat'})
c['services'] = svc
# ส่วนของหน้า + ฟีเจอร์
c['sections'] = [s for s in c.get('sections', []) if s['id'] not in REMOVED_SECS]
for i, s in enumerate(sorted(c['sections'], key=lambda x: x.get('order', 0))): s['order'] = i + 1
f = c.setdefault('features', {})
for k in ('cctv', 'alerts', 'simulation'): f[k] = False
for k in ('cctv', 'alerts', 'simulation'): c.get('featureLabels', {}).pop(k, None)
c.get('featureLabels', {}).pop('traffic', None)
# ลิงก์ส่วนท้าย
c.setdefault('footer', {})['links'] = [l for l in c['footer'].get('links', []) if l.get('href') not in ('#traffic', '#tourist', '#cctv')]
# แชทบอท: ตัดคำตอบ/ปุ่มลัดที่ชี้ไปยังฟีเจอร์ที่ถูกตัด
b = c['chatbot']
b['kb'] = [k for k in b.get('kb', []) if not any(t in (k.get('a', '') + k.get('aEn', '')) for t in ('#traffic', '#cctv', '#tourist'))]
QR = {'th': ('สภาพจราจร', 'จอดรถบนทางเท้า'), 'en': ('Traffic', 'Parking on sidewalk'), 'zh': ('交通', '人行道停车'), 'ru': ('Пробки', 'Парковка на тротуаре')}
for lg, (old, new) in QR.items():
    q = b.get('quickRepliesI18n', {}).get(lg, [])
    b['quickRepliesI18n'][lg] = [new if x == old else x for x in q]
b['quickReplies'] = b['quickRepliesI18n']['th']
G = {'th': (' หรือข้อมูลนักท่องเที่ยวได้เลยฮะ', ' ได้เลยฮะ'), 'en': (' or tourist help.', '.'), 'zh': ('以及游客帮助。', '。'), 'ru': (' и помощи туристам.', '.')}
for lg, (a, z) in G.items():
    if lg in b.get('greetings', {}): b['greetings'][lg] = b['greetings'][lg].replace(a, z).replace('(с', '(с')
b['greetings']['en'] = b['greetings']['en'].replace(', local rules & fines (with official source links).', ' or local rules & fines (with official source links).')
b['greeting'] = b['greetings']['th']
for k in b.get('kb', []):
    if k.get('id') == 'hello':
        k['a'], k['aEn'], k['aZh'], k['aRu'] = b['greetings']['th'], b['greetings']['en'], b['greetings']['zh'], b['greetings']['ru']
b['systemPrompt'] = b.get('systemPrompt', '').replace(' ข้อมูลนักท่องเที่ยว จราจร/แจ้งเหตุบนเว็บ', '')
c.pop('tourist', None)
json.dump(c, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('services', [s['title'] for s in c['services']]); print('sections', [s['id'] for s in c['sections']]); print('kb', [k['q'] for k in b['kb']])
print(b['greetings']); print(b['quickRepliesI18n'])
