"""Re-take preview screenshots. Requires server running: PORT=3100 npm start"""
import asyncio, sys
from playwright.async_api import async_playwright
D = '/workspace/tesakij-pattaya/'
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3100/'
PREP = """async () => {
  document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'));
  window.__runCounters && window.__runCounters();
  window.__track && window.__track('TKP-2569-00123');
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for name, w, h, m in [('desktop', 1440, 900, False), ('mobile', 390, 844, True)]:
            pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1 if not m else 2, is_mobile=m, has_touch=m)
            errs = []
            pg.on('console', lambda msg: errs.append(msg.text) if msg.type == 'error' else None)
            await pg.goto(URL, wait_until='networkidle')
            await pg.evaluate('document.fonts.ready')
            await pg.evaluate(PREP)
            # load lazy images
            await pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
            await pg.evaluate("document.getElementById('traffic').scrollIntoView()"); await pg.wait_for_timeout(4000)
            await pg.evaluate('window.scrollTo(0,0)'); await pg.wait_for_timeout(300)
            print(name, 'fonts', await pg.evaluate("[document.fonts.check('16px Prompt'), document.fonts.check('16px Sarabun')]"), 'errs', errs)
            # fixed overlays (bottom bar / chat button) would float mid-page in a stitched full-page capture
            await pg.add_style_tag(content='#chatFab, nav[aria-label="เมนูลัด"] { visibility:hidden !important }')
            await pg.screenshot(path=D + f'preview-{name}.png', full_page=True)
            await pg.add_style_tag(content='#chatFab, nav[aria-label="เมนูลัด"] { visibility:visible !important }')
            if not m:
                # road alerts map: open first alert popup, capture the section
                await pg.evaluate("document.getElementById('traffic').scrollIntoView()"); await pg.wait_for_timeout(5000)
                await pg.evaluate("(()=>{const a=Object.values(TKPAlerts._store).find(x=>x.type==='accident'); a&&TKPAlerts.goto(a.id,15)})()")
                await pg.wait_for_timeout(3500)
                await pg.set_viewport_size({'width': 1440, 'height': 1400}); await pg.wait_for_timeout(800)
                await pg.add_style_tag(content='#siteHeader,#chatFab{visibility:hidden !important}')
                await pg.locator('#traffic').screenshot(path=D + 'preview-map.png')
                await pg.evaluate("TKPCCTV.open(1)"); await pg.wait_for_timeout(5000)
                await pg.locator('#traffic').screenshot(path=D + 'preview-cctv.png')
                await pg.evaluate("TKPCCTV.close()")
                await pg.add_style_tag(content='#siteHeader,#chatFab{visibility:visible !important}')
                await pg.set_viewport_size({'width': 1440, 'height': 900})
            if m:
                await pg.evaluate("document.querySelector('[data-open-report]').click()"); await pg.wait_for_timeout(600)
                await pg.evaluate("document.querySelector('[data-rtype=construction]').click()"); await pg.wait_for_timeout(2500)
                await pg.screenshot(path=D + 'preview-report.png')
                await pg.evaluate("document.querySelector('[data-close-report]').click()"); await pg.wait_for_timeout(400)
                await pg.evaluate("window.__openChat(true)")
                await pg.wait_for_timeout(400)
                await pg.evaluate("window.__chatSend('เบอร์ฉุกเฉิน')")
                await pg.wait_for_timeout(1500)
                await pg.screenshot(path=D + 'preview-chat.png')
                await pg.evaluate("window.__openChat(false)"); await pg.wait_for_timeout(300)
                await pg.evaluate("window.__openComplaint(true)"); await pg.wait_for_timeout(700)
                await pg.screenshot(path=D + 'preview-complaint.png')
        await b.close()
asyncio.run(main())
