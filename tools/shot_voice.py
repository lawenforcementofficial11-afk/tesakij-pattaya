"""ทดสอบ UI เสียงพูด/ไมค์แบบ headless (จำลอง speechSynthesis + SpeechRecognition) และถ่าย preview-voice.png
ต้องเปิดเซิร์ฟเวอร์ที่ :3000 ก่อน"""
import asyncio, json, os
from playwright.async_api import async_playwright
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
MOCK = r"""
(()=>{window.__tts=[];window.__talk=[];
const voices=[{name:'Microsoft Premwadee Online (Natural) - Thai (Thailand)',lang:'th-TH',voiceURI:'p'},{name:'Microsoft Niwat Online (Natural) - Thai (Thailand)',lang:'th-TH',voiceURI:'n'},{name:'Google US English',lang:'en-US',voiceURI:'g'},{name:'Google 普通话（中国大陆）',lang:'zh-CN',voiceURI:'z'}];
const synth={getVoices:()=>voices,cancel(){this._c=(this._c||0)+1},addEventListener(){},speaking:false,
 speak(u){const c=this._c||0;window.__tts.push({text:u.text,voice:u.voice&&u.voice.name,pitch:u.pitch,rate:u.rate,lang:u.lang});
  setTimeout(()=>{if((this._c||0)!==c)return;u.onstart&&u.onstart({});let n=0;const iv=setInterval(()=>{if((this._c||0)!==c){clearInterval(iv);return}u.onboundary&&u.onboundary({});if(++n>Math.min(25,u.text.length/4)){clearInterval(iv);u.onend&&u.onend({})}},120)},40)}};
Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
window.SpeechSynthesisUtterance=function(t){this.text=t};
function SR(){const r=this;r.start=function(){window.__sr=r;setTimeout(()=>r.onstart&&r.onstart(),50)};r.stop=function(){r.onend&&r.onend()}}
window.SpeechRecognition=SR;window.webkitSpeechRecognition=SR;
window.__srSay=function(text,final){const r=window.__sr;const res=[{0:{transcript:text},isFinal:!!final,length:1}];res.length=1;r.onresult&&r.onresult({resultIndex:0,results:res});if(final)setTimeout(()=>r.onend&&r.onend(),100)};
})();"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel='chrome')
        errs = []
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script(MOCK)
        await pg.goto('http://localhost:3000/', wait_until='networkidle'); await pg.evaluate('document.fonts.ready')
        await pg.evaluate("localStorage.setItem('tkpLang','th');localStorage.removeItem('tkpVoice')"); await pg.reload(wait_until='networkidle'); await pg.evaluate('document.fonts.ready')
        await pg.wait_for_timeout(500)
        hint = await pg.evaluate("(()=>{const h=document.querySelector('#chatHint');return h&&getComputedStyle(h).display!=='none'?h.textContent.trim():null})()")
        await pg.screenshot(path='/workspace/scratch/v-teaser.png')
        await pg.click('#chatFab'); await pg.wait_for_timeout(700)
        talking = await pg.evaluate("document.querySelectorAll('#chatHeroFig .mascot.talking').length")
        await pg.wait_for_timeout(2500)
        g = await pg.evaluate("window.__tts.slice()")
        spk = await pg.evaluate("(()=>{const b=document.querySelector('#chatSpk');return {visible:getComputedStyle(b).display!=='none',pressed:b.getAttribute('aria-pressed')}})()")
        mic = await pg.evaluate("getComputedStyle(document.querySelector('#chatMic')).display")
        await pg.fill('#chatInput', 'ทิ้งขยะปรับเท่าไร'); await pg.press('#chatInput', 'Enter'); await pg.wait_for_timeout(1400)
        talking2 = await pg.evaluate("document.querySelectorAll('#chatHeadFig .mascot.talking').length")
        await pg.screenshot(path=D + 'preview-voice-speaking.png')
        tts = await pg.evaluate("window.__tts.slice(-6)")
        replay = await pg.evaluate("document.querySelectorAll('.msg-say').length")
        await pg.wait_for_timeout(4500)
        await pg.click('#chatMic'); await pg.wait_for_timeout(300)
        await pg.evaluate("window.__srSay('จอดรถบนทางเท้า', false)"); await pg.wait_for_timeout(300)
        listening = await pg.evaluate("({mic:document.querySelector('#chatMic').classList.contains('mic-on'),ph:document.querySelector('#chatInput').placeholder,val:document.querySelector('#chatInput').value,fig:document.querySelectorAll('.mascot.listening').length})")
        await pg.evaluate("document.querySelector('#chatLog').scrollTop=1e9")
        await pg.screenshot(path=D + 'preview-voice.png')
        await pg.evaluate("window.__srSay('จอดรถบนทางเท้าปรับเท่าไร', true)"); await pg.wait_for_timeout(1800)
        last_user = await pg.evaluate("[...document.querySelectorAll('#chatLog > .justify-end')].pop().textContent")
        await pg.click('#chatSpk'); await pg.wait_for_timeout(200)
        n0 = await pg.evaluate("window.__tts.length")
        await pg.fill('#chatInput', 'เวลาทำการ'); await pg.press('#chatInput', 'Enter'); await pg.wait_for_timeout(1800)
        n1 = await pg.evaluate("window.__tts.length")
        off = await pg.evaluate("({ls:localStorage.getItem('tkpVoice'),replayHidden:[...document.querySelectorAll('.msg-say')].every(b=>b.classList.contains('hidden'))})")
        print(json.dumps({'teaser': hint, 'talkingOnGreet': talking, 'greetingSpoken': g[:1], 'speaker': spk, 'micDisplay': mic, 'talkingOnReply': talking2,
              'replyChunks': tts, 'replayButtons': replay, 'listening': listening, 'autoSent': last_user, 'mutedNoSpeak': n1 == n0, 'off': off, 'errors': errs}, ensure_ascii=False, indent=1))
        # unsupported browser: no mic button
        pg2 = await b.new_page(viewport={'width': 1280, 'height': 800})
        await pg2.add_init_script("delete window.SpeechRecognition; delete window.webkitSpeechRecognition; Object.defineProperty(window,'webkitSpeechRecognition',{value:undefined});")
        await pg2.goto('http://localhost:3000/', wait_until='networkidle'); await pg2.evaluate("window.__openChat(true)"); await pg2.wait_for_timeout(500)
        print('unsupported mic display:', await pg2.evaluate("getComputedStyle(document.querySelector('#chatMic')).display"))
        await b.close()
if __name__ == '__main__':
    asyncio.run(main())
