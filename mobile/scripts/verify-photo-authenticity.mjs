import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import assert from 'node:assert/strict'
const base=process.env.TEST_BASE||'http://127.0.0.1:3213'
const out='../qa/photo-replacement';fs.mkdirSync(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms))
const errors=[],missing=[]
try{
 const page=await browser.newPage();await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true})
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))missing.push(r.url())})
 await page.evaluateOnNewDocument(()=>localStorage.setItem('agri:session',JSON.stringify({role:'admin',username:'admin',nickname:'管理员'})))
 await page.goto(base+'/#overview',{waitUntil:'networkidle2'})
 const route=async n=>{await page.evaluate(n=>location.hash=n,n);await page.waitForSelector('.page-'+n);await pause(500)}
 const click=async(label,scope='body')=>{await page.evaluate(({label,scope})=>{const root=[...document.querySelectorAll(scope)].at(-1);const el=[...root.querySelectorAll('button')].find(e=>e.textContent.trim().includes(label));if(!el)throw Error('No '+label);el.click()},{label,scope});await pause(350)}
 assert((await page.$eval('.overview-hero>img',el=>el.src)).endsWith('corn-field.jpg'))
 await route('identify')
 const samples=[]
 for(const label of ['白粉病','霜霉病','蚜虫','叶螨']){
  await click(label,'.reference-samples');await page.waitForFunction(()=>document.querySelector('.identify-frame img')?.naturalWidth>0)
  samples.push(await page.$eval('.identify-frame img',el=>el.src))
  assert.match(await page.$eval('.photo-credit',el=>el.textContent),/实拍参考/)
 }
 assert.equal(new Set(samples).size,4)
 await click('白粉病','.reference-samples');await page.click('.photo-credit summary');await pause(400)
 assert.match(await page.$eval('.photo-source-body',el=>el.textContent),/Agronom/)
 await page.screenshot({path:out+'/identify-sources.png',fullPage:true})
 await page.click('.photo-credit summary');await click('使用示例图');await pause(2300)
 assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('agri-mobile-state-v1')).identifyRecords[0].img)).endsWith('wheat-powdery.jpg'))
 const alertSources=[]
 for(const name of ['白粉病','霜霉病','蚜虫','红蜘蛛']){
  await route('overview');await route('alerts');await click(name,'.page-alerts');await pause(350)
  alertSources.push(await page.$eval('.page-alerts img',el=>el.src))
  assert.match(await page.$eval('.photo-credit',el=>el.textContent),/实拍参考/)
  if(name==='蚜虫')await page.screenshot({path:out+'/alert-aphid.png',fullPage:false})
 }
 assert.equal(new Set(alertSources).size,4)
 await route('patrol');await click('模拟采集');await pause(350)
 assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('agri-mobile-state-v1')).roverShots[0].img)).endsWith('soybean-downy.jpg'))
 await page.evaluate(()=>window.scrollTo(0,600));await pause(350);await page.screenshot({path:out+'/patrol.png',fullPage:false})
 await page.evaluate(()=>{
  const state=JSON.parse(localStorage.getItem('huinong-workflow-v2'));const at=Date.now();
  state.events.unshift({id:'legacy-photo',sourceId:'legacy-photo',kind:'photo',fieldId:'A1',at,title:'保留的历史记录',detail:'旧版图片审核测试',photo:'images/live-rover.jpg'});
  localStorage.setItem('huinong-workflow-v2',JSON.stringify(state));location.hash='history'
 });await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('.page-history');await click('保留的历史记录','.history-list')
 assert.match(await page.$eval('.event-photo',el=>el.textContent),/旧版示意图已移除/)
 await page.click('.event-photo');await page.waitForSelector('[role=dialog]');assert.match(await page.$eval('[role=dialog]',el=>el.textContent),/旧版示意图已移除/)
 await page.keyboard.press('Escape');await pause(400)
 await route('reports');await page.waitForSelector('.report-preview img')
 const summary=await page.$eval('.report-accessible-summary',el=>el.textContent)
 assert.match(summary,/0 张用户上传照片/,'reference samples must not count as uploaded report photos')
 await route('spray');assert.equal(await page.$('.page-spray img'),null)
 for(const width of [320,390,768]){
  await page.setViewport({width,height:844,isMobile:true,hasTouch:true})
  for(const n of ['identify','patrol','spray']){await route(n);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${n} overflows ${width}`)}
 }
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await route('patrol')
 assert.equal(await page.$eval('.schematic-pulse',el=>getComputedStyle(el).animationName),'none')
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
 fs.writeFileSync(out+'/photo-ui-results.json',JSON.stringify({samples,alertSources,checks:['four distinct references and attribution','sample identify/patrol persistence','retired historic image placeholder without data deletion','reference exclusion from reports','no spray photographs','9 layouts','reduced motion'],errors,missing},null,2))
 console.log('PASS photographic references, history and layout checks')
}finally{await browser.close()}
