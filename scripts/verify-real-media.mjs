import puppeteer from 'puppeteer-core'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
await fs.mkdir('qa/real-media',{recursive:true})
const base=process.env.TEST_BASE || 'http://127.0.0.1:5182/'
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']})
const page=await browser.newPage(), errors=[], checks=[]
page.on('pageerror',e=>errors.push(String(e)))
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)})
const wait=ms=>new Promise(r=>setTimeout(r,ms))
const click=async(text,scope='main')=>{await page.evaluate((text,scope)=>{const e=[...document.querySelectorAll(`${scope} button`)].find(e=>e.textContent.includes(text));if(!e)throw Error('No button '+text);e.click()},text,scope);await wait(150)}
const go=async(route)=>{await page.goto(base+'#'+route,{waitUntil:'networkidle0'});await page.waitForSelector('.page-'+route);await wait(700)}
try{
 for(const width of [1440,390,768]){
  await page.setViewport({width,height:width===1440?1080:900})
  for(const route of ['map','inspection','alerts']){
   await go(route)
   assert.equal(await page.$eval('main',e=>e.scrollWidth>e.clientWidth+2),false,route+' overflow '+width)
   if(route==='alerts'){
    for(const img of await page.$$('.alert-photo')){await img.evaluate(e=>e.scrollIntoView({block:'center'}));await img.evaluate(e=>e.decode())}
    const sources=await page.$$eval('.alert-photo',imgs=>imgs.map(i=>({src:i.currentSrc,width:i.naturalWidth,alt:i.alt})))
    assert.equal(new Set(sources.map(i=>i.src)).size,5)
    assert.ok(sources.every(i=>i.width>0))
    await page.$eval('.alert-list',e=>e.scrollIntoView({block:'start'}))
   }else{
    const src=await page.$eval('.satellite-photo',e=>e.getAttribute('href'))
    assert.ok(src.includes('/real/farm-satellite.jpg'))
    assert.equal(await page.evaluate(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth);i.onerror=()=>resolve(0);i.src=src}),src),1800)
    await page.$eval(route==='map'?'.satellite-map-frame':'.patrol-panel',e=>e.scrollIntoView({block:'start'}))
   }
   await wait(250);await page.screenshot({path:`qa/real-media/${route}-${width}.png`})
  }
 }
 checks.push('Real images and responsive layout load at 1440 / 768 / 390 px')
 await page.setViewport({width:1440,height:1080});await go('map')
 await page.click('[data-field="A1"]');assert.ok((await page.$eval('main',e=>e.innerText)).includes('安排灌溉'))
 await click('安排灌溉');assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('agri-platform-state-v1')).tasks.some(t=>t.title==='A1 水稻灌溉作业')))
 await page.click('[aria-label="放大地图"]');assert.ok((await page.$eval('main',e=>e.innerText)).includes('120%'))
 await page.click('[aria-label="复位地图"]');assert.ok((await page.$eval('main',e=>e.innerText)).includes('100%'))
 await click('监测点','.page-heading-actions');assert.equal(await page.$('.monitor-overlay'),null)
 await click('灌溉管线','.page-heading-actions');assert.equal(await page.$('.irrigation-overlay'),null)
 await page.$eval('[data-field="B1"]',e=>e.focus());await page.keyboard.press('Enter');assert.equal(await page.$eval('[data-field="B1"]',e=>e.getAttribute('aria-pressed')),'true')
 checks.push('Map field selection, keyboard activation, irrigation task, zoom/reset and layers')
 await go('inspection');await click('暂停巡检','.robot-card');await wait(1100)
 const pos=await page.$eval('.rover-position',e=>e.getAttribute('transform'));await wait(1200);assert.equal(await page.$eval('.rover-position',e=>e.getAttribute('transform')),pos)
 await click('继续巡检','.robot-card');await wait(1300);assert.notEqual(await page.$eval('.rover-position',e=>e.getAttribute('transform')),pos)
 checks.push('Patrol follows real imagery; pause freezes marker and resume moves it')
 await go('alerts')
 for(const title of ['白粉病','蚜虫聚集','大豆霜霉病','土壤盐渍化','干燥土壤']){
  await page.click(`.alert-photo-button[aria-label*="${title}"]`)
  await page.waitForSelector('.photo-reference img')
  assert.ok((await page.$eval('.photo-reference',e=>e.innerText)).includes('原图来源'))
  assert.ok(await page.$eval('.photo-reference img',e=>e.naturalWidth>0))
  assert.equal(await page.$$eval('.photo-reference a',links=>links.every(a=>a.href.startsWith('https://'))),true)
  if(title==='大豆霜霉病')await page.screenshot({path:'qa/real-media/photo-detail.png'})
  await page.keyboard.press('Escape')
 }
 checks.push('All five alerts open their own reference image with author/source/license')
 assert.deepEqual(errors,[])
 const result={passed:true,base,checks,errors};await fs.writeFile('qa/real-media/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2))
}finally{await browser.close()}
