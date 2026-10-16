"""Screenshots for laws / chatbot mascot / admin layout. Requires server: ADMIN_PASSWORD=demo1234 PORT=3000 npm start"""
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tools'))
from shot_voice import MOCK  # จำลองเสียงพูด (headless ไม่มีเสียงในเครื่อง), sys, os
from playwright.async_api import async_playwright
D = '/workspace/tesakij-pattaya/'
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000/'
PW = os.environ.get('ADMIN_PASSWORD', 'demo1234')
PREP = "() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'))"
MASCOT_CARD = """()=>{const M=(c)=>TKPMascot.svg('assets/logo.png',c);
const st=(h,t)=>'<div style="text-align:center"><div style="width:150px;height:178px;margin:auto">'+h+'</div><p style="margin:6px 0 0;font:600 15px Prompt;color:#0b2545">'+t+'</p></div>';
document.body.innerHTML='<div style="height:100vh;display:flex;align-items:center;gap:40px;padding:0 60px;box-sizing:border-box;background:radial-gradient(circle at 28% 50%,#e0fbff 0,#d5ecf8 35%,#b9d7ec 100%);font-family:Sarabun">'+
'<div style="width:470px;height:560px;flex:none">'+M('static')+'</div>'+
'<div><p style="font:700 34px Prompt;color:#0b2545;margin:0">น้องAIเทศกิจพัทยา</p><p style="font:400 17px Sarabun;color:#334155;margin:6px 0 26px">หุ่นยนต์ผู้ช่วยต้นฉบับ · SVG หลายเลเยอร์ + CSS แอนิเมชัน · ตราโล่เทศกิจพัทยาที่หน้าอก</p>'+
'<div style="display:flex;gap:26px;align-items:flex-end">'+st(M('static talking'),'กำลังพูด')+st(M('static happy'),'ยิ้ม (hover)')+
'<div style="text-align:center"><div style="display:flex;gap:10px;align-items:center;justify-content:center;height:178px"><span style="width:44px;height:44px;border-radius:50%;overflow:hidden;background:linear-gradient(#f0f9ff,#cffafe);box-shadow:0 0 0 2px #67e8f9"><img src="assets/mascot.png" style="width:100%;transform:scale(1.55);transform-origin:top;margin-top:2px"></span><span style="width:88px;height:104px"><img src="assets/mascot.png" style="width:100%"></span></div><p style="margin:6px 0 0;font:600 15px Prompt;color:#0b2545">ภาพนิ่ง mascot.png</p></div></div></div></div>';
document.querySelectorAll('.mascot.happy .m-eyeball').forEach(e=>e.style.opacity=0);document.querySelectorAll('.mascot.happy .m-happy').forEach(e=>e.style.opacity=1);
document.querySelectorAll('.mascot.happy .m-head').forEach(e=>{e.style.animation='none';e.style.transform='rotate(-7deg)'});
document.querySelectorAll('.mascot.talking .m-talk').forEach(e=>{e.style.animation='none'});
}"""
async def main():
    async with async_playwright() as p:
        _l = p.chromium.launch
        b = await _l(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        errs = []
        # laws (desktop)
        pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL, wait_until='networkidle'); await pg.evaluate('document.fonts.ready'); await pg.evaluate(PREP)
        await pg.add_style_tag(content='#siteHeader,#chatFab{visibility:hidden !important}')
        await pg.evaluate("document.getElementById('laws').scrollIntoView()"); await pg.wait_for_timeout(800)
        await pg.locator('#laws').screenshot(path=D + 'preview-laws-full.png')
        box = await pg.locator('#laws').bounding_box()
        await pg.set_viewport_size({'width': 1440, 'height': 1300}); await pg.evaluate("window.scrollTo(0, document.getElementById('laws').getBoundingClientRect().top + scrollY)"); await pg.wait_for_timeout(500)
        await pg.screenshot(path=D + 'preview-laws.png')
        print('laws order:', await pg.evaluate("[...document.querySelectorAll('main>[data-sec]')].map(e=>e.dataset.sec+(e.classList.contains('hidden')?'(off)':'')).join(' > ')"))
        await pg.close()
        # chatbot (mobile 390, mascot, Chinese then Thai legal Q)
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await pg.add_init_script(MOCK)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL, wait_until='networkidle'); await pg.evaluate('document.fonts.ready')
        await pg.evaluate("localStorage.setItem('tkpLang','th')"); await pg.reload(wait_until='networkidle'); await pg.evaluate('document.fonts.ready')
        await pg.wait_for_timeout(600)
        await pg.evaluate("window.__openChat(true)"); await pg.wait_for_timeout(700)
        await pg.evaluate("window.__chatSend('เวลาทำการ')"); await pg.wait_for_timeout(1500)
        await pg.evaluate("document.querySelector('#chatLog').scrollTop=0"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=D + 'preview-chatbot.png')
        await pg.evaluate("localStorage.setItem('tkpLang','zh')"); await pg.reload(wait_until='networkidle'); await pg.evaluate('document.fonts.ready')
        await pg.evaluate("window.__openChat(true)"); await pg.wait_for_timeout(900)
        await pg.evaluate("window.__chatSend('乱扔垃圾罚多少钱？')"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=D + 'preview-chatbot-answer.png')
        await pg.close()
        # mascot closeup (states)
        pg = await b.new_page(viewport={'width': 1200, 'height': 700}, device_scale_factor=1)
        await pg.goto(URL, wait_until='networkidle'); await pg.evaluate('document.fonts.ready')
        await pg.evaluate(MASCOT_CARD); await pg.wait_for_timeout(900)
        await pg.screenshot(path=D + 'preview-mascot.png'); await pg.close()
        # desktop chatbot with mascot + English
        pg = await b.new_page(viewport={'width': 1280, 'height': 860})
        await pg.add_init_script(MOCK)
        await pg.goto(URL, wait_until='networkidle'); await pg.evaluate('document.fonts.ready')
        await pg.evaluate("document.querySelector('.lang-opt[data-lang=EN]').click()"); await pg.wait_for_timeout(300)
        await pg.evaluate("window.__openChat(true)"); await pg.wait_for_timeout(500)
        await pg.add_style_tag(content='#toast{display:none!important}')
        await pg.evaluate("window.__chatSend('Can I park my motorbike on the sidewalk?')"); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=D + 'preview-chatbot-desktop.png')
        await pg.close()
        # admin layout
        pg = await b.new_page(viewport={'width': 1440, 'height': 980})
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL + 'admin/', wait_until='networkidle')
        await pg.fill('#pw', PW); await pg.click('#loginForm button'); await pg.wait_for_timeout(1200)
        await pg.click('[data-tab=layout]'); await pg.wait_for_timeout(600)
        await pg.evaluate("document.fonts.ready")
        await pg.screenshot(path=D + 'preview-admin-sections.png', full_page=True)
        print('errors:', errs)
        await b.close()
asyncio.run(main())
