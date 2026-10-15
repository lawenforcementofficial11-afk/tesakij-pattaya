"""Screenshots for laws / chatbot mascot / admin layout. Requires server: ADMIN_PASSWORD=demo1234 PORT=3000 npm start"""
import asyncio, sys, os
from playwright.async_api import async_playwright
D = '/workspace/tesakij-pattaya/'
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000/'
PW = os.environ.get('ADMIN_PASSWORD', 'demo1234')
PREP = "() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'))"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
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
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL, wait_until='networkidle'); await pg.evaluate('document.fonts.ready')
        await pg.evaluate("localStorage.setItem('tkpLang','zh')"); await pg.reload(wait_until='networkidle'); await pg.evaluate('document.fonts.ready')
        await pg.wait_for_timeout(600)
        await pg.screenshot(path='/tmp/fab.png')
        await pg.evaluate("window.__openChat(true)"); await pg.wait_for_timeout(1100)
        await pg.screenshot(path=D + 'preview-chatbot.png')
        await pg.evaluate("window.__chatSend('乱扔垃圾罚多少钱？')"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=D + 'preview-chatbot-answer.png')
        await pg.close()
        # desktop chatbot with mascot + English
        pg = await b.new_page(viewport={'width': 1280, 'height': 860})
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
