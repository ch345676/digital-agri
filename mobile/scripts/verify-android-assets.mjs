import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=path.resolve(process.env.APK_ASSETS||'qa/apk-verified/assets/web')
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
const types={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4',json:'application/json',woff2:'font/woff2'}
const pause=ms=>new Promise(r=>setTimeout(r,ms))
try{
 const page=await browser.newPage(),errors=[],missing=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true})
 await page.setUserAgent((await browser.userAgent())+' HuinongAndroid/1.0')
 await page.setRequestInterception(true)
 page.on('request',async request=>{
  if(request.url().startsWith('data:'))return request.continue()
  const url=new URL(request.url())
  if(url.hostname!=='appassets.androidplatform.net')return request.abort('internetdisconnected')
  const file=path.resolve(root,decodeURIComponent(url.pathname.replace(/^\/assets\//,'')))
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){missing.push(url.pathname);return request.respond({status:404,body:'Not found'})}
  return request.respond({status:200,contentType:types[path.extname(file).slice(1)]||'application/octet-stream',body:fs.readFileSync(file)})
 })
 await page.goto('https://appassets.androidplatform.net/assets/index.html#overview',{waitUntil:'networkidle2'})
 await page.type('input[type=password]','admin123');await page.$eval('form',e=>e.requestSubmit());await page.waitForSelector('.app-tabs')
 assert(await page.evaluate(()=>window.isSecureContext&&!!crypto.subtle))
 for(const name of ['overview','irrigation','patrol','fields','tasks','history','demo','notifications','identify','team','prediction','spray']){
  await page.evaluate(n=>location.hash=n,name);await page.waitForSelector('.page-'+name);await pause(300)
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await pause(150)
 }
 await page.screenshot({path:'qa/completion/android-assets.png'})
 await page.evaluate(()=>{localStorage.setItem('agri:session',JSON.stringify({role:'guest',nickname:'游客'}));location.hash='tasks'});await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('[aria-label="新建任务"]');await page.click('[aria-label="新建任务"]');await pause(400);assert.equal(await page.$('form.work-form'),null)
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('agri:guest:huinong-workflow-v2')).tasks.length),2)
 await page.evaluate(()=>{localStorage.setItem('agri:session',JSON.stringify({role:'user',username:'apk-test',nickname:'测试用户'}));location.hash='tasks'});await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('[aria-label="新建任务"]');await page.click('[aria-label="新建任务"]');await page.waitForSelector('form.work-form');await page.type('.work-form input[maxlength="60"]','安卓离线任务');await page.$eval('form.work-form',e=>e.requestSubmit());await pause(500);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('agri:user:apk-test:huinong-workflow-v2')).tasks[0].status),'待分派')
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[])
 fs.writeFileSync('qa/completion/android-assets-results.json',JSON.stringify({checks:['APK bundled asset startup at secure appassets origin','offline login','12 routes with network unavailable','guest read-only','user tasks await administrator assignment','independent account data'],missing,errors},null,2))
 console.log('PASS signed APK bundled assets, offline login, 12 routes, account separation and role guards')
}finally{await browser.close()}
