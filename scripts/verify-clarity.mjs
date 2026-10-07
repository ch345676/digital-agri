import puppeteer from 'puppeteer-core'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const base=process.env.TEST_BASE||'http://127.0.0.1:5185/'
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,protocolTimeout:30000,args:['--no-sandbox','--disable-gpu','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-features=CalculateNativeWinOcclusion']})
const page=await browser.newPage(),errors=[],checks=[],layout=[]
page.on('pageerror',e=>errors.push(e.message))
await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}])
await page.evaluateOnNewDocument(()=>localStorage.setItem('huinong-motion','off'))
const go=async route=>{await page.goto(base+'#'+route,{waitUntil:'networkidle2'});await page.waitForSelector('.page-'+route);await page.evaluate(()=>document.fonts.ready)}
const click=async(text,scope='main')=>page.evaluate((text,scope)=>{const b=[...document.querySelectorAll(scope+' button')].find(e=>e.textContent.includes(text));assertButton(b);function assertButton(b){if(!b)throw Error('Missing '+text);b.click()}},text,scope)
const capture=async name=>{await page.evaluate(async()=>{await Promise.all([...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}).map(i=>i.decode().catch(()=>{})))});await page.screenshot({path:`qa/clarity-${name}.png`})}
try {
 await fs.mkdir('qa',{recursive:true})
 for(const [width,dpr] of [[1920,1],[1440,1],[1280,1.25],[1024,1],[768,2],[390,3],[320,2]]) {
  await page.setViewport({width,height:1000,deviceScaleFactor:dpr})
  for(const route of ['dashboard','map','inspection','alerts','tasks','soil','history','harvest','crops','devices','analytics','inventory','team','settings']) {
   await go(route)
   const bounds=await page.$eval('main',e=>({client:e.clientWidth,scroll:e.scrollWidth}))
   assert.ok(bounds.scroll<=bounds.client+2,`Horizontal overflow: ${width}px ${route} ${JSON.stringify(bounds)}`)
   const tiny=await page.evaluate(()=>[...document.querySelectorAll('.page-stage *, .topbar *, .mobile-bottom *')].filter(e=>!(e instanceof SVGElement)&&!e.closest('svg')&&e.getBoundingClientRect().height>0&&[...e.childNodes].some(n=>n.nodeType===3&&/[\u4e00-\u9fff]/.test(n.textContent))&&parseFloat(getComputedStyle(e).fontSize)<12).map(e=>({text:e.textContent.slice(0,30),class:e.className,size:getComputedStyle(e).fontSize})))
   assert.deepEqual(tiny,[],`${route} contains unreadable Chinese captions at ${width}px`)
   layout.push({width,dpr,route,...bounds})
  }
  console.log('Readable type and layout:',width,'px /',dpr,'DPR')
 }
 checks.push('All 14 routes fit seven viewport/DPR combinations; Chinese interface captions are at least 12 CSS pixels')

 await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});await go('dashboard')
 const cdp=await page.createCDPSession();await cdp.send('DOM.enable');await cdp.send('CSS.enable')
 const {root}=await cdp.send('DOM.getDocument');const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'.overview-heading h1'})
 const fonts=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts
 assert.ok(fonts.length&&fonts.every(f=>f.isCustomFont),'Headline must actually use the bundled vector font, not a platform fallback')
 await cdp.detach()
 const typography=await page.evaluate(()=>({transform:getComputedStyle(document.querySelector('.page-stage')).transform,requests:performance.getEntriesByType('resource').filter(e=>e.name.includes('.woff2')).map(e=>e.name)}))
 assert.equal(typography.transform,'none');assert.ok(typography.requests.length>0&&typography.requests.every(u=>new URL(u).origin===locationOrigin()))
 function locationOrigin(){return new URL(base).origin}
 checks.push('Actual Chinese glyphs use the local variable font; no external font service or permanent page scaling')
 await capture('verified-dashboard-1440')
 await page.setViewport({width:390,height:1000,deviceScaleFactor:2});await go('dashboard')
 const mapType=await page.$$eval('.field-label-title',nodes=>nodes.map(e=>{const m=e.getScreenCTM();return parseFloat(getComputedStyle(e).fontSize)*Math.hypot(m.a,m.b)}))
 assert.ok(mapType.length===5&&mapType.every(n=>n>=13.9),'Map labels must remain legible in screen pixels')
 await page.$eval('[data-field="B2"]',e=>e.dispatchEvent(new MouseEvent('click',{bubbles:true})))
 assert.equal(await page.$eval('[aria-label="全站地块"]',e=>e.value),'B2')
 checks.push('Compact satellite labels stay readable and field selection still updates the shared context')
 await capture('verified-dashboard-390')

 await go('soil');await click('养分','.soil-scene-tabs')
 const density=[]
 for(const dpr of [1,2,3]) {
  await page.setViewport({width:390,height:1000,deviceScaleFactor:dpr})
  // CDP metric overrides change DPR without emitting the OS/browser resize event.
  await page.evaluate(()=>window.dispatchEvent(new Event('resize')))
  await page.waitForFunction(dpr=>{const c=document.querySelector('.soil-photo-scene canvas');return Math.abs(c.width-c.getBoundingClientRect().width*dpr)<=1},{timeout:10000},dpr)
  density.push(await page.$eval('.soil-photo-scene canvas',c=>({cssWidth:c.getBoundingClientRect().width,width:c.width,height:c.height,dpr:devicePixelRatio})))
 }
 const labels=await page.$$eval('.soil-element-node',nodes=>nodes.map(e=>e.textContent))
 assert.equal(labels.length,4)
 checks.push('Existing soil canvas repaints at DPR 1, 2 and 3 without navigation; N/P/K/OM controls stay available')
 await page.$eval('.soil-metric-picker',e=>e.scrollIntoView({block:'start'}));await capture('verified-soil-picker-390')

 await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});await go('devices')
 await page.select('[aria-label="全站地块"]','')
 const pictures=await page.$$eval('.device-reference-frame img',async nodes=>{nodes.forEach(e=>e.loading='eager');await Promise.all(nodes.map(e=>e.decode()));return nodes.map(e=>({url:e.currentSrc,fit:getComputedStyle(e).objectFit,loaded:e.naturalWidth>0}))})
 assert.ok(pictures.length===7&&pictures.every(i=>i.loaded&&i.fit==='cover'&&i.url.includes('.webp')),JSON.stringify(pictures))
 await capture('verified-devices-1440')
 await page.$eval('.device-reference',e=>e.click());await page.waitForSelector('[role="dialog"]')
 assert.ok((await page.$eval('.photo-reference img',e=>e.src)).endsWith('.jpg'),'Full original remains accessible')
 await page.keyboard.press('Escape')
 checks.push('All seven farmland photos load responsive variants and fill their frames; original-photo dialog works')

 await go('analytics');await click('演示趋势','.analysis-source');await page.$eval('.resource-flow',e=>e.scrollIntoView({block:'center'}));await capture('verified-resource-1440')
 await page.setViewport({width:390,height:1000,deviceScaleFactor:2});await page.$eval('.resource-flow',e=>e.scrollIntoView({block:'start'}));await capture('verified-resource-390')
 await go('history');await page.$eval('.replay-chart',e=>e.scrollIntoView({block:'center'}));await capture('verified-history-390')
 assert.deepEqual(errors,[])
 await fs.writeFile('qa/clarity-verification.json',JSON.stringify({passed:true,checks,layout,fonts,typography,density,pictures,errors},null,2))
 console.log('PASS',checks.length,'checks /',layout.length,'route layouts')
} catch(error) {
 await fs.writeFile('qa/clarity-verification.json',JSON.stringify({passed:false,checks,layout,errors,failure:error.message},null,2))
 throw error
} finally {await browser.close()}
