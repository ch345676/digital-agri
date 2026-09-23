import puppeteer from 'puppeteer-core'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
const base=process.env.TEST_BASE||'http://127.0.0.1:5183/'
await fs.mkdir('qa/photo-layout',{recursive:true})
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']})
const page=await browser.newPage(),errors=[],results=[]
page.on('pageerror',e=>errors.push(String(e)))
const go=async route=>{await page.goto(base+'#'+route,{waitUntil:'networkidle0'});await page.waitForSelector('.page-'+route);await new Promise(r=>setTimeout(r,700))}
try{
for(const width of [1440,390,768]){
 await page.setViewport({width,height:1000})
 for(const route of ['alerts','tasks','soil','harvest','crops']){
  await go(route)
  assert.equal(await page.$eval('main',e=>e.scrollWidth>e.clientWidth+2),false,route+' overflow '+width)
  const selector=route==='alerts'?'.alert-photo':'.crop-reference>img'
  for(const img of await page.$$(selector)){await img.evaluate(e=>e.scrollIntoView({block:'center'}));await img.evaluate(e=>e.decode())}
  if(['alerts','harvest','crops'].includes(route)){
   const sizes=await page.$$eval(selector,imgs=>imgs.map(i=>({src:i.currentSrc,w:i.clientWidth,h:i.clientHeight})))
   assert.equal(new Set(sizes.map(i=>i.src)).size,5)
   assert.ok(sizes.every(i=>i.w/i.h>1.2&&i.w/i.h<1.8),JSON.stringify(sizes))
   await page.$eval(selector,e=>e.scrollIntoView({block:'start'}))
  }
  if(route==='soil'){
   assert.equal(await page.$('.recommendation video'),null)
   assert.ok((await page.$eval('.recommendation',e=>e.innerText)).includes('本次监测摘要'))
   await page.$eval('.recommendation',e=>e.scrollIntoView({block:'center'}))
  }
  if(route==='tasks'){
   assert.ok(await page.$('.task-illustration'))
   await page.$eval('.task-illustration',e=>e.scrollIntoView({block:'start'}))
  }
  await new Promise(r=>setTimeout(r,1000))
  await page.screenshot({path:`qa/photo-layout/${route}-${width}.png`})
  results.push(route+' '+width)
 }
}
await page.setViewport({width:1440,height:1000});await go('crops')
for(const button of await page.$$('.crop-reference')){
 await button.click();await page.waitForSelector('.photo-reference img');await page.$eval('.photo-reference img',e=>e.decode())
 assert.ok((await page.$eval('.photo-reference',e=>e.innerText)).includes('原图来源'))
 await page.keyboard.press('Escape');await page.waitForSelector('.agri-modal',{hidden:true})
}
await go('soil');await page.$$eval('.field-tabs button',b=>b[1].click())
assert.ok((await page.$eval('.recommendation',e=>e.innerText)).includes('A2'))
assert.ok((await page.$eval('.recommendation',e=>e.innerText)).includes('优先复测项目'))
await page.$$eval('.recommendation button',b=>b.find(x=>x.textContent.includes('创建复核任务')).click())
assert.ok((await page.$eval('.recommendation',e=>e.innerText)).includes('已创建复核任务'))
assert.deepEqual(errors,[])
console.log(JSON.stringify({passed:true,base,results,checks:['five full-image dialogs','soil field summary and task creation'],errors},null,2))
}finally{await browser.close()}

