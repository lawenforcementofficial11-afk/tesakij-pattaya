"""บุคลิกน้องAI: เด็กผู้ชายสุภาพ อ่อนโยน ภาษาไทยลงท้ายด้วย 'ฮะ' + ค่าเสียงพูดเริ่มต้น (idempotent)
python3 tools/apply_persona.py   (build_laws.py เรียกให้อัตโนมัติ)"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'data', 'content.json')
THAI_END = re.compile(r'[\u0E00-\u0E7F]$')

def particle_line(line, pt):
    if not line.strip() or re.search(r'(ฮะ|ครับ|ค่ะ)(\s|$|[👉🙏—])', line): return re.sub(r'(ครับ|ค่ะ)(?=\s|$|[👉🙏—!.])', pt, line)
    if line.lstrip()[:1] in '☎✉💬📍🕗' or '{' in line[-12:]: return line  # บรรทัดข้อมูลติดต่อ
    if THAI_END.search(line): return line + pt
    for mark in (' — ที่มา:', ' 👉'):
        i = line.find(mark)
        if i > 0 and THAI_END.search(line[:i]): return line[:i] + pt + line[i:]
    return line

def particle(text, pt='ฮะ'):
    return '\n'.join(particle_line(l, pt) for l in str(text).split('\n'))

def main():
    c = json.load(open(P, encoding='utf-8'))
    b = c.setdefault('chatbot', {})
    pt = b.setdefault('particle', 'ฮะ')
    b['greeting'] = 'สวัสดีฮะ 👋 น้องAIเทศกิจพัทยายินดีให้บริการฮะ ถามเรื่องการแจ้งร้องเรียน ติดตามสถานะ ข้อบัญญัติและค่าปรับ (มีลิงก์แหล่งข้อมูลทางราชการ) หรือข้อมูลนักท่องเที่ยวได้เลยฮะ'
    b.setdefault('greetings', {})['th'] = b['greeting']
    b['fallback'] = particle(re.sub(r'ขออภัย(ครับ|ค่ะ)', 'ขออภัยฮะ', b.get('fallback', '')), pt)
    b.setdefault('fallbackI18n', {})['th'] = b['fallback']
    for k in b.get('kb', []): k['a'] = particle(k['a'], pt)
    for f in c.get('faq', []): f['a'] = particle(f['a'], pt)
    v = b.setdefault('voice', {})
    for k, d in (('enabled', True), ('autoGreet', True), ('serverTts', True), ('gender', 'male'), ('rate', 1.0), ('pitch', 1.1)): v.setdefault(k, d)
    v.setdefault('greetings', {
        'th': 'สวัสดีฮะ ยินดีต้อนรับสู่เทศกิจพัทยาฮะ น้องAIยินดีช่วยเหลือฮะ',
        'en': "Hello! Welcome to Pattaya City Law Enforcement. I'm Nong AI, happy to help you!",
        'zh': '您好！欢迎来到芭提雅市执法处，小AI很高兴为您服务！',
        'ru': 'Здравствуйте! Добро пожаловать в муниципальную инспекцию Паттайи. Я Нонг AI, с радостью помогу!'})
    sp = b.get('systemPrompt', '')
    if '{particle}' not in sp:
        sp = sp.replace('กฎเคร่งครัด:', 'บุคลิก: เด็กผู้ชายวัยรุ่น สุภาพ อ่อนโยน น่ารัก แทนตัวเองว่า "น้องAI" · ภาษาไทยให้ลงท้ายประโยคด้วย "{particle}" อย่างเป็นธรรมชาติ (ไม่ใช้ ครับ/ค่ะ) · ภาษาอื่นตอบสุภาพ อบอุ่น เป็นกันเอง\nกฎเคร่งครัด:', 1)
        b['systemPrompt'] = sp
    json.dump(c, open(P, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
