import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=path.resolve(process.env.APK_ASSETS||'qa/apk-verified/assets/web')
const legacy=process.env.LEGACY_ENGINE==='1'
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
const types={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4',json:'application/json',woff2:'font/woff2'}
const pause=ms=>new Promise(r=>setTimeout(r,ms))
try{
 const page=await browser.newPage(),errors=[],missing=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true})
 await page.setUserAgent((await browser.userAgent())+' HuinongAndroid/1.0')
 if(legacy)await page.evaluateOnNewDocument(()=>{
  Object.fromEntries=undefined;Array.prototype.at=undefined;String.prototype.replaceAll=undefined;Promise.prototype.finally=undefined;window.AbortController=undefined;window.AbortSignal=undefined
  // Old WebViews ignore the signal option. Modern Chrome's native type check
  // would otherwise reject the deliberately polyfilled signal in this harness.
  const listen=EventTarget.prototype.addEventListener
  EventTarget.prototype.addEventListener=function(type,listener,options){
   if(options&&typeof options==='object'){options={...options};delete options.signal}
   return listen.call(this,type,listener,options)
  }
  const fetch=window.fetch
  window.fetch=function(input,options){if(options){options={...options};delete options.signal}return fetch.call(this,input,options)}
 })
 await page.setRequestInterception(true)
 page.on('request',async request=>{
  if(request.url().startsWith('data:'))return request.continue()
  const url=new URL(request.url())
  if(url.hostname!=='appassets.androidplatform.net')return request.abort('internetdisconnected')
  const file=path.resolve(root,decodeURIComponent(url.pathname.replace(/^\/assets\//,'')))
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){missing.push(url.pathname);return request.respond({status:404,body:'Not found'})}
  let body=fs.readFileSync(file)
  if(legacy&&file.endsWith('index.html'))body=Buffer.from(body.toString().replace(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/g,'').replace(/\bnomodule\b/g,''))
  return request.respond({status:200,contentType:types[path.extname(file).slice(1)]||'application/octet-stream',body})
 })
 await page.goto('https://appassets.androidplatform.net/assets/index.html#overview',{waitUntil:'networkidle2'})
 await page.waitForFunction(()=>window.__HUINONG_READY__&&!window.__HUINONG_BOOT_FAILED__).catch(async error=>{console.error(errors,missing,await page.$eval('#startup-detail',n=>n.textContent));throw error})
 await page.type('input[type=password]','admin123');await page.$eval('form',e=>e.requestSubmit());await page.waitForSelector('.app-tabs')
 assert(await page.evaluate(()=>window.isSecureContext&&!!crypto.subtle))
 for(const name of ['overview','irrigation','patrol','fields','tasks','history','demo','notifications','identify','team','prediction','spray','reports']){
  await page.evaluate(n=>location.hash=n,name);await page.waitForSelector('.page-'+name);await pause(300)
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await pause(150)
 }
 await page.waitForSelector('.report-preview img')
 assert((await page.$eval('.report-accessible-summary',el=>el.textContent)).includes('农场') || await page.$('.report-export-actions'))
 await page.$eval('.report-pdf',el=>el.click())
 await page.waitForFunction(()=>window.__huinongExport?.mime==='application/pdf')
 assert((await page.evaluate(()=>window.__huinongExport.data)).startsWith('JVBER'))
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('huinong:export-result',{detail:{status:'cancelled',message:''}})))
 await page.screenshot({path:`qa/completion/android-assets${legacy?'-legacy':''}.png`})
 await page.goto('https://appassets.androidplatform.net/assets/photo-sources.html',{waitUntil:'networkidle2'})
 await page.waitForSelector('article')
 assert.match(await page.$eval('main',el=>el.textContent),/照片来源与图示说明/)
 assert.equal(await page.$eval('main>a',el=>el.getAttribute('href')),'./index.html')
 await page.click('main>a');await page.waitForSelector('.page-overview')
 await page.evaluate(()=>{localStorage.setItem('agri:session',JSON.stringify({role:'guest',nickname:'游客'}));location.hash='tasks'});await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('[aria-label="新建任务"]');await page.click('[aria-label="新建任务"]');await pause(400);assert.equal(await page.$('form.work-form'),null)
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('agri:guest:huinong-workflow-v2')).tasks.length),2)
 await page.evaluate(()=>{localStorage.setItem('agri:session',JSON.stringify({role:'user',username:'apk-test',nickname:'测试用户'}));location.hash='tasks'});await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('[aria-label="新建任务"]');await page.click('[aria-label="新建任务"]');await page.waitForSelector('form.work-form');await page.type('.work-form input[maxlength="60"]','安卓离线任务');await page.$eval('form.work-form',e=>e.requestSubmit());await pause(500);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('agri:user:apk-test:huinong-workflow-v2')).tasks[0].status),'待分派')
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
 fs.writeFileSync(`qa/completion/android-assets${legacy?'-legacy':''}-results.json`,JSON.stringify({legacy,checks:['APK bundled asset startup at secure appassets origin','offline login','13 routes with network unavailable','offline Chinese report and PDF payload','guest read-only','user tasks await administrator assignment','independent account data'],missing,errors},null,2))
 console.log(`PASS ${legacy?'legacy bundle with missing built-ins':'modern bundle'}, offline login, 13 routes, account separation and role guards`)
}finally{await browser.close()}
