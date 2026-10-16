"""สร้าง assets/mascot.png (ภาพนิ่งพื้นโปร่งใส) จาก assets/mascot.js — ต้องเปิดเซิร์ฟเวอร์ที่ :3000 ก่อน
python3 tools/make_mascot_png.py"""
import asyncio, os
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome')
        pg = await b.new_page(viewport={'width': 512, 'height': 608}, device_scale_factor=1)
        await pg.goto('http://localhost:3000/', wait_until='networkidle')
        await pg.evaluate("""()=>{document.documentElement.style.background='transparent';document.body.style.cssText='margin:0;background:transparent';
          document.body.innerHTML='<div id=m style="width:512px;height:608px">'+TKPMascot.svg('assets/logo.png','static')+'</div>';
          document.querySelectorAll('.mascot *').forEach(e=>e.style.animation='none');
          return new Promise(r=>{const i=document.querySelector('#m image');if(i)setTimeout(r,500);else r();});}""")
        await pg.locator('#m').screenshot(path=os.path.join(ROOT, 'assets', 'mascot.png'), omit_background=True)
        await b.close()
asyncio.run(main())
