import puppeteer from 'puppeteer-core'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const base=process.env.TEST_BASE||'http://127.0.0.1:3213'
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
const out='qa/motion';fs.mkdirSync(out,{recursive:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms))
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true})
 const click=async text=>{await page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(t));assertButton(b)?.click();function assertButton(el){if(!el)throw Error('Missing '+t);return el}},text);await pause(600)}
 const route=async name=>{await page.evaluate(n=>location.hash=n,name);await page.waitForSelector(`.page-${name}`);await pause(500)}
 const center=async selector=>{await page.waitForSelector(selector);await page.$eval(selector,e=>e.scrollIntoView({block:'center'}));await pause(500)}
 await page.goto(base+'/#overview',{waitUntil:'networkidle2'})
 await click('注册');await page.waitForSelector('input[placeholder="再次输入密码"]');assert.equal(await page.$$eval('input[type=password]',e=>e.length),2)
 await click('管理员登录');await page.waitForSelector('input[placeholder="初始密码 admin123"]');await page.type('input[type=password]','admin123');await page.click('button[type=submit]');await page.waitForSelector('.app-tabs');await pause(650)
 assert.equal(await page.$('video'),null)
 await route('irrigation');await center('.farm-demo')
 const before=await page.$eval('.farm-map-slot',e=>e.getBoundingClientRect().height)
 await page.click('[aria-label="展开地图"]');await pause(500)
 const expanded=await page.$eval('.farm-expanded',e=>{const r=e.getBoundingClientRect();return {top:r.top,left:r.left,right:r.right,bottom:r.bottom}})
 assert(expanded.left>=0&&expanded.right<=391&&expanded.top>=0&&expanded.bottom<=845,JSON.stringify(expanded))
 await page.keyboard.press('Escape');await pause(500);assert.equal(await page.$('.farm-expanded'),null)
 assert(Math.abs(await page.$eval('.farm-map-slot',e=>e.getBoundingClientRect().height)-before)<2)
 assert.notEqual(await page.$eval('body',e=>e.style.overflow),'hidden')
 // Rapid opening/closing must settle on the last selection.
 await page.evaluate(()=>{for(const id of ['A1','B2','C1'])document.querySelector(`[data-field="${id}"]`).dispatchEvent(new MouseEvent('click',{bubbles:true}))});await pause(650)
 assert((await page.$eval('.farm-field-detail',e=>e.textContent)).includes('C1'))
 await page.click('[aria-label="关闭地块详情"]');await pause(350);assert.equal(await page.$('.farm-field-detail'),null)
 await center('[data-valve-field="C1"]');await page.click('[data-valve-field="C1"]');await pause(350)
 const valve=await page.$eval('[data-valve-field="C1"]',e=>({height:e.getBoundingClientRect().height,on:e.getAttribute('aria-pressed')}));assert(valve.height<=54);assert.equal(valve.on,'true')
 await page.screenshot({path:`${out}/valves.png`})
 await center('[role=switch]');const planWasOn=await page.$eval('[role=switch]',e=>e.getAttribute('aria-checked'))
 await page.click('[role=switch]');await pause(400);assert.notEqual(await page.$eval('[role=switch]',e=>e.getAttribute('aria-checked')),planWasOn)
 await route('patrol');await click('云台');await pause(100)
 assert((await page.$eval('body',e=>e.innerText)).includes('云台角度'))
 await click('云台');await pause(100);assert(!(await page.$eval('body',e=>e.innerText)).includes('云台角度'))
 await click('结构图鉴');assert((await page.$eval('body',e=>e.innerText)).includes('整机爆炸结构'))
 await page.evaluate(()=>document.querySelector('[class*="z-[1100]"] button')?.click());await pause(500)
 assert.equal(await page.$('img[alt="整机爆炸结构总览"]'),null)
 await route('identify');await click('使用示例图');assert(await page.$eval('.identify-frame',e=>e.dataset.phase==='scanning'))
 await page.waitForFunction(()=>document.querySelector('.identify-frame')?.dataset.phase==='done');await pause(350)
 await page.screenshot({path:`${out}/identify.png`,fullPage:true})
 await route('team');await center('input[placeholder="发送消息…"]');await page.type('input[placeholder="发送消息…"]','检查动画与演示状态')
 await page.click('[aria-label="发送消息"]');await pause(250);assert(await page.$('[aria-label="模拟回复中"]'))
 await page.waitForSelector('[aria-label="模拟回复中"]',{hidden:true,timeout:8000});await pause(350)
 const chat=await page.$eval('[role=log]',e=>({text:e.innerText,gap:e.scrollHeight-e.scrollTop-e.clientHeight}));assert(chat.text.includes('检查动画与演示状态'));assert(chat.gap<8)
 await page.screenshot({path:`${out}/team.png`})
 await page.evaluate(()=>{for(const key of ['irrigation','alerts','patrol','overview'])location.hash=key});await pause(950);assert(await page.$('.page-overview'))
 // Decorative work stops in background and under the OS accessibility setting.
 await route('irrigation');await center('.farm-demo')
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await pause(150)
 assert.equal(await page.$eval('.irrigation-flow',e=>getComputedStyle(e).animationPlayState),'paused')
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))})
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await pause(250)
 assert.equal(await page.$eval('.irrigation-flow',e=>getComputedStyle(e).animationName),'none')
 await page.click('[aria-label="展开地图"]');await pause(100);await page.keyboard.press('Escape');await pause(100);assert.equal(await page.$('.farm-expanded'),null)
 for(const width of [320,390,768]){await page.setViewport({width,height:844,isMobile:true,hasTouch:true});for(const name of ['overview','irrigation','alerts','identify','patrol','team','prediction','spray']){await route(name);await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await pause(200);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await page.$$eval('[data-reveal]',els=>els.filter(e=>{const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&getComputedStyle(e).opacity!=='1'}).length),0)}}
 assert.deepEqual(errors,[])
 fs.writeFileSync(`${out}/results.json`,JSON.stringify({checks:['login/register disclosure','photo cards without video','map expansion and Escape preserves layout','rapid field switching','compact linked valves','plan collapse','gimbal and atlas close','identify scanning to result','chat pending and auto scroll','rapid page navigation','background and reduced motion','24 reduced-motion route/viewport checks'],errors},null,2))
 console.log('PASS motion interactions, race conditions, reduced motion and 24 layouts')
} finally {await browser.close()}
