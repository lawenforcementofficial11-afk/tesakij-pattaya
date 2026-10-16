"""Full-page previews for layout-v2. Requires server on :3000."""
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_voice import MOCK
from playwright.async_api import async_playwright
D = '/workspace/tesakij-pattaya/'
OUT = sys.argv[1] if len(sys.argv) > 1 else D
URL = 'http://localhost:3000/'
PREP = "() => { document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')); document.querySelectorAll('.counter').forEach(c=>c.textContent=(+c.dataset.target).toLocaleString('th-TH')); }"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        errs = []
        for name, vp, mob in [('preview-v2-desktop.png', {'width':1440,'height':900}, False), ('preview-v2-mobile.png', {'width':390,'height':844}, True)]:
            kw = dict(viewport=vp, device_scale_factor=1 if not mob else 2)
            if mob: kw.update(is_mobile=True, has_touch=True)
            pg = await b.new_page(**kw)
            await pg.add_init_script(MOCK)
            pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.add_init_script("localStorage.setItem('tkpLang','th')")
            await pg.goto(URL, wait_until='networkidle'); await pg.evaluate('document.fonts.ready')
            h = await pg.evaluate('document.body.scrollHeight')
            for y in range(0, h, 600):
                await pg.evaluate(f'window.scrollTo(0,{y})'); await pg.wait_for_timeout(60)
            await pg.add_style_tag(content='body{position:relative} #mobileBar{position:absolute!important;bottom:0!important} #chatFab{position:absolute!important}')
            await pg.evaluate('window.scrollTo(0,0)'); await pg.evaluate(PREP); await pg.wait_for_timeout(1200)
            # Chrome caps a single capture at ~8k device px → shoot in clipped chunks and stitch
            from PIL import Image
            H = await pg.evaluate('document.documentElement.scrollHeight'); dpr = kw['device_scale_factor']
            step = 7000 // dpr; parts = []
            for i, y in enumerate(range(0, H, step)):
                fn = f'/tmp/_v2part{i}.png'
                await pg.screenshot(path=fn, full_page=True, clip={'x': 0, 'y': y, 'width': vp['width'], 'height': min(step, H - y)})
                parts.append(fn)
            ims = [Image.open(f) for f in parts]
            out = Image.new('RGB', (ims[0].width, sum(i.height for i in ims)))
            yy = 0
            for im in ims: out.paste(im, (0, yy)); yy += im.height
            out.save(OUT + name)
            print(name, await pg.evaluate("[...document.querySelectorAll('main>[data-sec]')].filter(e=>!e.classList.contains('hidden')).map(e=>e.dataset.sec).join(' > ')"), await pg.evaluate('document.body.scrollHeight'))
            if not mob:
                # chat via hero ask button
                await pg.click('#heroAsk .hero-ask'); await pg.wait_for_timeout(2500)
                print('chat msgs:', await pg.evaluate("document.querySelectorAll('#chatLog > div').length"), 'panel open:', await pg.evaluate("!document.querySelector('#chatPanel').classList.contains('closed')"))
                await pg.screenshot(path=OUT + 'v2-chat.png')
            await pg.close()
        print('ERRORS:', errs)
        await b.close()
asyncio.run(main())
