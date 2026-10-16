"""แทนข้อมูลตัวอย่างด้วยข้อมูลจริงที่ตรวจสอบจากเว็บไซต์ทางการเมืองพัทยา (ตรวจสอบ 16 ต.ค. 2569) — idempotent"""
import json, os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'content.json')
c = json.load(open(P, encoding='utf-8'))
CHECKED = '2026-10-16'
SRC = {
  'contact': 'https://pattaya.go.th/%e0%b8%95%e0%b8%b4%e0%b8%94%e0%b8%95%e0%b9%88%e0%b8%ad%e0%b9%80%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%87%e0%b8%9e%e0%b8%b1%e0%b8%97%e0%b8%a2%e0%b8%b2/%e0%b8%95%e0%b8%b4%e0%b8%94%e0%b8%95%e0%b9%88%e0%b8%ad%e0%b9%80%e0%b8%a3%e0%b8%b2/',
  'contactInfo': 'https://pattaya.go.th/%e0%b8%82%e0%b9%89%e0%b8%ad%e0%b8%a1%e0%b8%b9%e0%b8%a5%e0%b8%81%e0%b8%b2%e0%b8%a3%e0%b8%95%e0%b8%b4%e0%b8%94%e0%b8%95%e0%b9%88%e0%b8%ad/',
  'phones': 'https://pattaya.go.th/2026/08/03/%f0%9f%9a%98-%e0%b8%84%e0%b8%b7%e0%b8%99%e0%b8%84%e0%b8%a7%e0%b8%b2%e0%b8%a1%e0%b9%80%e0%b8%9b%e0%b9%87%e0%b8%99%e0%b8%a3%e0%b8%b0%e0%b9%80%e0%b8%9a%e0%b8%b5%e0%b8%a2%e0%b8%9a%e0%b8%8a%e0%b8%b2/',
  'office': 'https://pattaya.go.th/2026/01/30/%e0%b9%80%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%87%e0%b8%9e%e0%b8%b1%e0%b8%97%e0%b8%a2%e0%b8%b2%e0%b8%97%e0%b8%b3%e0%b8%9a%e0%b8%b8%e0%b8%8d%e0%b8%aa%e0%b8%b3%e0%b8%99%e0%b8%b1%e0%b8%81%e0%b8%87%e0%b8%b2/',
  'structure': 'https://pattaya.go.th/2026/02/10/%e0%b8%a3%e0%b8%ad%e0%b8%87%e0%b8%99%e0%b8%b2%e0%b8%a2%e0%b8%81%e0%b9%80%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%87%e0%b8%9e%e0%b8%b1%e0%b8%97%e0%b8%a2%e0%b8%b2%e0%b8%9b%e0%b8%a3%e0%b8%b0%e0%b8%8a%e0%b8%b8-3/',
  'chart': 'https://info.pattaya.go.th/DocLib1/65-%E0%B8%9C%E0%B8%B1%E0%B8%87%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%AA%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B9%80%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%87%E0%B8%9E%E0%B8%B1%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A3%E0%B8%A7%E0%B8%A1-%E0%B8%9B%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B8%9B%E0%B8%A3%E0%B8%B8%E0%B8%87%20(1).pdf',
  'hours': 'https://pattaya.go.th/2026/04/28/%f0%9f%93%a2%e0%b9%80%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%87%e0%b8%9e%e0%b8%b1%e0%b8%97%e0%b8%a2%e0%b8%b2%e0%b8%82%e0%b8%ad%e0%b9%80%e0%b8%8a%e0%b8%b4%e0%b8%8d%e0%b8%8a%e0%b8%a7%e0%b8%99%e0%b8%9b/',
  'infoContact': 'https://info.pattaya.go.th/DocLib12/%E0%B8%95%E0%B8%B4%E0%B8%94%E0%B8%95%E0%B9%88%E0%B8%AD%E0%B9%80%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%87%E0%B8%9E%E0%B8%B1%E0%B8%97%E0%B8%A2%E0%B8%B2.aspx',
}
s = c['site']
s.update({
  'subtitle': 'ส่วนปกครอง สำนักปลัดเมืองพัทยา',
  'subtitleSource': SRC['structure'],
  'hotlineLabel': 'Pattaya Contact Center (24 ชม.)',
  'hotline': '1337', 'hotlineIsPlaceholder': False, 'hotlineSource': SRC['contact'],
  'email': 'saraban@pattaya.go.th', 'emailLabel': 'สารบรรณเมืองพัทยา', 'emailSource': SRC['contact'],
  'address': 'สำนักงานเทศกิจเมืองพัทยา ซอยหนองเกตุ (โรงไม้ขีด)', 'addressSource': SRC['office'],
  'cityHallAddress': 'ศาลาว่าการเมืองพัทยา 171 หมู่ 6 ถนนพัทยาเหนือ ตำบลนาเกลือ อำเภอบางละมุง จังหวัดชลบุรี 20150', 'cityHallSource': SRC['contact'],
  'hours': 'จันทร์–ศุกร์ 08.30–16.30 น. (เวลาราชการ) · สายด่วน 1337 และศูนย์วิทยุสีครามตลอด 24 ชม.', 'hoursSource': SRC['phones'],
  'lineId': '@pattayaconnect', 'lineLabel': 'LINE Official เมืองพัทยา', 'lineUrl': 'https://line.me/R/ti/p/@pattayaconnect', 'lineSource': SRC['contact'], 'lineQr': '',
  'facebook': 'https://www.facebook.com/Prpattayacity', 'facebookLabel': 'Facebook ประชาสัมพันธ์เมืองพัทยา', 'facebookSource': SRC['contactInfo'],
  'website': 'https://pattaya.go.th',
  'noticeBar': 'ข้อมูลติดต่อและข่าวอ้างอิงจากเว็บไซต์ทางการเมืองพัทยา (pattaya.go.th) · ตรวจสอบล่าสุด 16 ต.ค. 2569',
  'checked': CHECKED,
  'contacts': [
    {'label': 'Pattaya Contact Center (ศูนย์รับเรื่องร้องเรียนเมืองพัทยา)', 'value': '1337', 'tel': '1337', 'note': 'ตลอด 24 ชั่วโมง', 'source': SRC['phones']},
    {'label': 'ฝ่ายนโยบายและแผนงานเทศกิจ', 'value': '038-253143', 'tel': '038253143', 'note': 'วันจันทร์–ศุกร์', 'source': SRC['phones']},
    {'label': 'ศูนย์วิทยุสีคราม', 'value': '038-427960', 'tel': '038427960', 'note': 'ตลอด 24 ชั่วโมง', 'source': SRC['phones']},
    {'label': 'ศาลาว่าการเมืองพัทยา (โทรศัพท์กลาง)', 'value': '0-3825-3100', 'tel': '038253100', 'note': '', 'source': SRC['contact']},
  ],
})
c['about'] = {
  'eyebrow': 'เกี่ยวกับเรา',
  'heading': 'ดูแลความสงบเรียบร้อย ความสะอาด และความเป็นระเบียบของเมืองพัทยา',
  'text': 'เทศกิจเมืองพัทยามีบทบาทสำคัญในการรักษาความสงบเรียบร้อย ความสะอาด และความเป็นระเบียบของบ้านเมือง ตามพระราชบัญญัติระเบียบบริหารราชการเมืองพัทยา พ.ศ. 2542',
  'bullets': ['บังคับใช้กฎหมายท้องถิ่น และดูแลสาธารณสมบัติ', 'จัดระเบียบหาดทรายชายทะเล และการจราจร', 'ควบคุมการค้าขายบนทางเท้า เพื่อส่งเสริมการท่องเที่ยวและความปลอดภัยของประชาชนและนักท่องเที่ยว'],
  'source': SRC['office'],
  'org': 'ฝ่ายนโยบายและแผนงานเทศกิจ · ส่วนปกครอง · สำนักปลัดเมืองพัทยา — พื้นที่ปฏิบัติงานเขตนาเกลือ เขตพัทยา และเขตจอมเทียน',
  'orgSources': [SRC['structure'], SRC['chart']],
}
c['sources'] = SRC
# stats: ไม่มีตัวเลขทางการที่ยืนยันได้ → ปิดส่วนนี้และล้างตัวเลขสมมติ
c['stats'] = {'title': 'ผลการดำเนินงาน', 'isExample': False, 'items': [], 'note': 'ยังไม่มีตัวเลขทางการที่ยืนยันได้ — ปิดไว้จนกว่าจะมีข้อมูลพร้อมแหล่งที่มา'}
for x in c['sections']:
    if x['id'] == 'stats': x['enabled'] = False
    if x['id'] == 'royal': x['label'] = 'ส่วนถวายพระพร (แถบบนสุด)'
# ข่าวจริงจาก pattaya.go.th
c['news'] = [
  {'title': 'คืนความเป็นระเบียบชายหาด พัทยาปล่อยแถวแก้ปัญหาจอดรถ-จราจร', 'date': '2026-08-03', 'category': 'จัดระเบียบชายหาด',
   'excerpt': 'นายกเมืองพัทยาพร้อมคณะผู้บริหารปล่อยแถวที่แยกชายหาดพัทยากลาง เตรียมจัดระเบียบการจอดรถ แก้ปัญหาจราจร และเพิ่มความปลอดภัยให้ประชาชนและนักท่องเที่ยว',
   'image': 'assets/news/LINE_NOTE_260803_21.jpg', 'link': SRC['phones'], 'source': 'pattaya.go.th'},
  {'title': 'เมืองพัทยาลุยจัดระเบียบชายหาด ควบคู่ดูแลกลุ่มเปราะบาง', 'date': '2026-07-22', 'category': 'จัดระเบียบเมือง',
   'excerpt': 'ปล่อยแถวลงพื้นที่ชายหาดพัทยาจัดระเบียบบุคคลไร้ที่พึ่ง ควบคู่การดูแลช่วยเหลือร่วมกับศูนย์คุ้มครองฯ จังหวัดชลบุรี สำนักสวัสดิการสังคม และฝ่ายปกครอง',
   'image': 'assets/news/LINE_NOTE_260722_8.jpg', 'link': 'https://pattaya.go.th/2026/07/22/%e0%b9%80%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%87%e0%b8%9e%e0%b8%b1%e0%b8%97%e0%b8%a2%e0%b8%b2%e0%b8%a5%e0%b8%b8%e0%b8%a2%e0%b8%88%e0%b8%b1%e0%b8%94%e0%b8%a3%e0%b8%b0%e0%b9%80%e0%b8%9a%e0%b8%b5%e0%b8%a2/', 'source': 'pattaya.go.th'},
  {'title': 'จัดระเบียบการจอดรถถนนเลียบชายหาดพัทยา–วอล์คกิ้งสตรีท ห้ามจอดตลอดแนว ดีเดย์ 1 ส.ค.', 'date': '2026-07-14', 'category': 'ประกาศ',
   'excerpt': 'ประชุมจัดระเบียบการจอดรถถนนเลียบชายหาดพัทยา แก้ปัญหานำรถจักรยานยนต์มาจอดเพื่อให้เช่าจนที่จอดรถนักท่องเที่ยวไม่เพียงพอ',
   'image': 'assets/news/LINE_NOTE_260715_2.jpg', 'link': 'https://pattaya.go.th/2026/07/15/%f0%9f%9a%a8%f0%9f%9b%b5%f0%9f%9b%bb%e0%b9%80%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%87%e0%b8%9e%e0%b8%b1%e0%b8%97%e0%b8%a2%e0%b8%b2%e0%b9%80%e0%b8%94%e0%b8%b4%e0%b8%99%e0%b8%ab%e0%b8%99%e0%b9%89%e0%b8%b2/', 'source': 'pattaya.go.th'},
  {'title': 'จัดระเบียบรถจักรยานยนต์ให้เช่าบนพื้นที่สาธารณะ เตรียมสำรวจพื้นที่และบังคับใช้กฎหมาย', 'date': '2026-06-16', 'category': 'จัดระเบียบเมือง',
   'excerpt': 'ประชุมหารือแนวทางแก้ปัญหาการนำรถจักรยานยนต์มาจอดให้เช่าในพื้นที่สาธารณะ กำหนดแนวทางห้ามจอด การบังคับใช้กฎหมาย และการจัดเก็บค่าธรรมเนียม',
   'image': 'assets/news/LINE_NOTE_260616_8.jpg', 'link': 'https://pattaya.go.th/2026/06/16/%f0%9f%9a%a8%f0%9f%8f%8d%ef%b8%8f%f0%9f%9b%b5%e0%b8%9b%e0%b8%a5%e0%b8%b1%e0%b8%94%e0%b9%80%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%87%e0%b8%9e%e0%b8%b1%e0%b8%97%e0%b8%a2%e0%b8%b2%e0%b8%95%e0%b8%b4%e0%b8%94/', 'source': 'pattaya.go.th'},
  {'title': 'ประชุมติดตามงานจัดระเบียบชายหาด–วอล์คกิ้งสตรีท ย้ำเจ้าหน้าที่ปฏิบัติหน้าที่อย่างเคร่งครัด', 'date': '2026-02-10', 'category': 'ส่วนปกครอง',
   'excerpt': 'รายงานผลการปฏิบัติงานของฝ่ายนโยบายและแผนงานเทศกิจในเขตนาเกลือ เขตพัทยา และเขตจอมเทียน รวมถึงการจัดระเบียบรถจักรยานยนต์ให้เช่าและการจอดรถวันคู่–วันคี่',
   'image': 'assets/news/LINE_NOTE_260210_36.jpg', 'link': SRC['structure'], 'source': 'pattaya.go.th'},
  {'title': 'เมืองพัทยาทำบุญสำนักงานเทศกิจ เสริมสิริมงคล สร้างขวัญกำลังใจผู้ปฏิบัติงาน', 'date': '2026-01-30', 'category': 'กิจกรรม',
   'excerpt': 'พิธีทำบุญสำนักงานเทศกิจเมืองพัทยา ณ ซอยหนองเกตุ โรงไม้ขีด เนื่องในโอกาสก้าวสู่ศักราชใหม่ เพื่อเสริมขวัญกำลังใจข้าราชการและพนักงานเทศกิจ',
   'image': 'assets/news/LINE_NOTE_260130_19.jpg', 'link': SRC['office'], 'source': 'pattaya.go.th'},
]
c['newsAllLink'] = 'https://pattaya.go.th/'
c['footer']['about'] = 'เทศกิจเมืองพัทยา · ส่วนปกครอง สำนักปลัดเมืองพัทยา — ดูแลความสงบเรียบร้อย ความสะอาด และความเป็นระเบียบของบ้านเมือง'
# features: hero mascot
c['features'].setdefault('heroMascot', True); c['features'].setdefault('heroDance', True)
b = c['chatbot']
b.setdefault('heroLines', ['สวัสดีฮะ 👋', 'ถามน้องได้เลยฮะ', 'กดที่น้องเพื่อคุยกันฮะ'])
# KB: ข้อมูลติดต่อจริง พร้อมแหล่งที่มา
kb = b['kb']
def put(q, entry):
    for i, k in enumerate(kb):
        if k.get('q') == q: kb[i] = entry; return
    kb.append(entry)
P1, P2 = SRC['phones'], SRC['contact']
put('เบอร์โทรฉุกเฉิน', {'q': 'เบอร์โทรฉุกเฉิน', 'keywords': ['ฉุกเฉิน', 'เบอร์', 'โทร', 'ตำรวจ', 'สายด่วน', '1337', 'emergency', 'police', 'ambulance', 'hotline', 'phone', '紧急', '警察', '救护车', '电话', 'экстренн', 'полиция', 'скорая', 'телефон'],
  'a': '🚨 เหตุฉุกเฉินโทร 191 (ตำรวจ) · 1155 (ตำรวจท่องเที่ยว) · 1669 (การแพทย์ฉุกเฉิน) ฮะ\n☎️ แจ้งเรื่องเดือดร้อนกับเมืองพัทยา: Pattaya Contact Center 1337 (ตลอด 24 ชม.) · ศูนย์วิทยุสีคราม 038-427960 (ตลอด 24 ชม.) · ฝ่ายนโยบายและแผนงานเทศกิจ 038-253143 (จันทร์–ศุกร์) ฮะ\nที่มา: ' + P1,
  'aEn': '🚨 Emergency: 191 (Police) · 1155 (Tourist Police) · 1669 (Medical).\n☎️ Pattaya City: Contact Center 1337 (24 h) · Si Khram radio centre 038-427960 (24 h) · Law Enforcement Policy & Planning Division 038-253143 (Mon–Fri).\nSource: ' + P1,
  'aZh': '🚨 紧急电话：191（警察）· 1155（旅游警察）· 1669（医疗急救）\n☎️ 芭提雅市：联络中心 1337（24小时）· Si Khram 无线电中心 038-427960（24小时）· 执法政策与规划科 038-253143（周一至周五）\n来源：' + P1,
  'aRu': '🚨 Экстренные номера: 191 (полиция) · 1155 (туристическая полиция) · 1669 (скорая).\n☎️ Город Паттайя: контакт-центр 1337 (24 ч) · радиоцентр Си Кхрам 038-427960 (24 ч) · отдел муниципальной инспекции 038-253143 (пн–пт).\nИсточник: ' + P1})
put('เวลาทำการ', {'q': 'เวลาทำการ', 'keywords': ['เวลาทำการ', 'เปิด', 'ปิด', 'กี่โมง', 'เวลาราชการ', 'hours', 'open', 'office', 'time', '办公时间', '几点', '营业', 'часы работы', 'время работы', 'когда открыто'],
  'a': '🕗 ฝ่ายนโยบายและแผนงานเทศกิจ ติดต่อได้วันจันทร์–ศุกร์ในเวลาราชการ (08.30–16.30 น.) โทร 038-253143 ฮะ\nนอกเวลา: Pattaya Contact Center 1337 และศูนย์วิทยุสีคราม 038-427960 ตลอด 24 ชม. ฮะ\nที่มา: ' + P1,
  'aEn': '🕗 Law Enforcement Policy & Planning Division: Mon–Fri, government office hours (08:30–16:30), tel. 038-253143. After hours: Contact Center 1337 and Si Khram radio centre 038-427960 (24 h). Source: ' + P1,
  'aZh': '🕗 执法政策与规划科：周一至周五办公时间（08:30–16:30），电话 038-253143。非办公时间：联络中心 1337、Si Khram 无线电中心 038-427960（24小时）。来源：' + P1,
  'aRu': '🕗 Отдел муниципальной инспекции: пн–пт, 08:30–16:30, тел. 038-253143. В нерабочее время: контакт-центр 1337 и радиоцентр 038-427960 (24 ч). Источник: ' + P1})
put('ติดต่อหน่วยงาน', {'q': 'ติดต่อหน่วยงาน', 'keywords': ['ติดต่อ', 'อีเมล', 'line', 'ไลน์', 'facebook', 'เฟซบุ๊ก', 'contact', 'email', 'address', 'ที่อยู่', 'สำนักงาน', 'อยู่ที่ไหน', '联系', '地址', '邮箱', 'контакт', 'адрес', 'почта', 'связаться'],
  'a': '📍 สำนักงานเทศกิจเมืองพัทยา ซอยหนองเกตุ (โรงไม้ขีด) ฮะ\n🏛️ ศาลาว่าการเมืองพัทยา 171 หมู่ 6 ถ.พัทยาเหนือ ต.นาเกลือ อ.บางละมุง จ.ชลบุรี 20150 โทร 0-3825-3100\n☎️ 1337 (24 ชม.) · ฝ่ายนโยบายและแผนงานเทศกิจ 038-253143\n✉️ saraban@pattaya.go.th · 💬 LINE @pattayaconnect · Facebook: https://www.facebook.com/Prpattayacity\nที่มา: ' + P2 + ' และ ' + SRC['office'],
  'aEn': '📍 Pattaya City Law Enforcement office: Soi Nong Ket (Rong Mai Khit).\n🏛️ Pattaya City Hall, 171 Moo 6, North Pattaya Rd, Na Kluea, Bang Lamung, Chonburi 20150, tel. 0-3825-3100.\n☎️ 1337 (24 h) · Division 038-253143 · ✉️ saraban@pattaya.go.th · LINE @pattayaconnect · Facebook https://www.facebook.com/Prpattayacity\nSource: ' + P2,
  'aZh': '📍 芭提雅市执法办公室：Nong Ket 巷（Rong Mai Khit）。\n🏛️ 芭提雅市政厅：Chonburi 府 Bang Lamung 县 Na Kluea 区北芭提雅路 171 号 6 村 20150，电话 0-3825-3100。\n☎️ 1337（24小时）· 038-253143 · ✉️ saraban@pattaya.go.th · LINE @pattayaconnect\n来源：' + P2,
  'aRu': '📍 Офис муниципальной инспекции Паттайи: сой Нонг Кет (Ронг Май Кхит).\n🏛️ Мэрия Паттайи: 171 Му 6, Норт-Паттайя-роуд, На Клыа, Банг Ламунг, Чонбури 20150, тел. 0-3825-3100.\n☎️ 1337 (24 ч) · 038-253143 · ✉️ saraban@pattaya.go.th · LINE @pattayaconnect\nИсточник: ' + P2})
put('เทศกิจพัทยาคือใคร มีหน้าที่อะไร', {'q': 'เทศกิจพัทยาคือใคร มีหน้าที่อะไร', 'keywords': ['หน้าที่', 'อำนาจ', 'สังกัด', 'เทศกิจคือ', 'ทำอะไร', 'ส่วนปกครอง', 'about', 'duty', 'duties', 'who are', 'what do', '职责', '是什么部门', 'обязанности', 'чем занимается'],
  'a': 'เทศกิจเมืองพัทยาสังกัดส่วนปกครอง สำนักปลัดเมืองพัทยา (ฝ่ายนโยบายและแผนงานเทศกิจ) ดูแลพื้นที่เขตนาเกลือ เขตพัทยา และเขตจอมเทียนฮะ\nหน้าที่หลัก: รักษาความสงบเรียบร้อย ความสะอาด และความเป็นระเบียบของบ้านเมือง ตาม พ.ร.บ.ระเบียบบริหารราชการเมืองพัทยา พ.ศ. 2542 — บังคับใช้กฎหมายท้องถิ่น ดูแลสาธารณสมบัติ จัดระเบียบหาดทรายชายทะเล การจราจร และควบคุมการค้าขายบนทางเท้าฮะ\nที่มา: ' + SRC['office'] + ' และ ' + SRC['structure'],
  'aEn': 'Pattaya City Law Enforcement (Thetsakit) belongs to the Administration Division, Office of the City Clerk (Law Enforcement Policy & Planning Section), covering Na Kluea, Pattaya and Jomtien zones. Duties: keep public order, cleanliness and tidiness under the Pattaya City Administration Act B.E. 2542 — enforce local laws, protect public property, organise beaches and traffic, and control sidewalk trading. Sources: ' + SRC['office'] + ' ; ' + SRC['structure'],
  'aZh': '芭提雅市执法（Thetsakit）隶属市政秘书处行政科（执法政策与规划组），负责 Na Kluea、芭提雅、宗甸三区。职责：依据《芭提雅市行政法》（2542）维护公共秩序与市容整洁——执行地方法规、管理公共财产、整顿海滩与交通、管控人行道摆摊。来源：' + SRC['office'],
  'aRu': 'Муниципальная инспекция Паттайи входит в административный отдел канцелярии мэрии (секция политики и планирования), зоны На Клыа, Паттайя и Джомтьен. Задачи: порядок, чистота и благоустройство по Закону об управлении Паттайей 2542 — исполнение местных правил, охрана общественного имущества, порядок на пляжах и дорогах, контроль торговли на тротуарах. Источник: ' + SRC['office']})
for k in kb:
    for f in ('a', 'aEn', 'aZh', 'aRu'):
        if isinstance(k.get(f), str): k[f] = k[f].replace('{hotline}', '1337')
json.dump(c, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok', len(kb), 'kb entries')
