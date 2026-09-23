import puppeteer from 'puppeteer-core'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
const base=process.env.TEST_BASE || 'http://127.0.0.1:5179/'
const out=path.resolve('qa')
await fs.mkdir(out,{recursive:true})
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']})
const page=await browser.newPage()
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)})
const pause=ms=>new Promise(r=>setTimeout(r,ms))
const click=async(text,scope='body',exact=false)=>{const ok=await page.evaluate((text,scope,exact)=>{const b=[...document.querySelectorAll(`${scope} button`)].find(b=>!b.disabled&&(exact?b.textContent.trim()===text:b.textContent.includes(text)));b?.click();return !!b},text,scope,exact);assert.ok(ok,`button: ${text}`);await pause(120)}
const has=async text=>assert.ok((await page.$eval('body',e=>e.innerText)).includes(text),`visible: ${text}`)
const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('agri-platform-state-v1')))
const go=async hash=>{await page.goto(`${base}#${hash}`,{waitUntil:'networkidle0'});await page.waitForSelector(`.page-${hash}`);await pause(650)}
const checks=[]
try{
await page.setViewport({width:1440,height:1050})
await go('dashboard');await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'networkidle0'})
await page.waitForSelector('.overview');await pause(1600)
await page.screenshot({path:path.join(out,'desktop-overview.png')})
await page.$eval('main',e=>e.scrollTo(0,e.scrollHeight));await pause(200);await page.screenshot({path:path.join(out,'desktop-overview-lower.png')})
const routes=['dashboard','tasks','soil','history','alerts','inspection','harvest','map','devices','crops','analytics','inventory','team','settings']
for(const size of [{width:1440,height:1050},{width:390,height:844},{width:768,height:1024}]){
 await page.setViewport(size)
 for(const route of routes){await go(route);const overflow=await page.$eval('main',e=>e.scrollWidth>e.clientWidth+2);if(overflow){console.log('OVERFLOW',size.width,route);const info=await page.evaluate(()=>[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+2).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,30)})).slice(0,10));console.log(JSON.stringify(info));}assert.equal(overflow,false,`${route} overflow at ${size.width}`);if(size.width!==768)await page.screenshot({path:path.join(out,`${route}-${size.width}.png`)})}
 checks.push(`14 routes without overflow at ${size.width}px`)
}
await page.setViewport({width:1440,height:1050})
await go('tasks');await click('新建任务','main');await page.type('input[placeholder*="例如：A1"]','测试：田间复核');await click('创建任务','.agri-modal',true);assert.ok((await stored()).tasks.some(t=>t.title==='测试：田间复核'));await page.reload({waitUntil:'networkidle0'});await has('测试：田间复核');checks.push('task creation and persistence')
await go('alerts');await click('查看与处置','main');await page.waitForSelector('[role="dialog"]');await click('创建处置任务','.agri-modal');assert.ok((await stored()).tasks.some(t=>t.title.includes('[A01]')));await has('处理中');await click('确认复核完成','.agri-modal');assert.equal((await stored()).tasks.find(t=>t.title.includes('[A01]')).status,'done');await page.keyboard.press('Escape');assert.equal(await page.$('[role="dialog"]'),null);await click('已解决','.segmented',true);await has('白粉病');checks.push('alert dispatch, resolution, task synchronization, keyboard dismissal')
await go('soil');await click('金石村','.field-tabs');await has('1.86');await click('创建复核任务','main');assert.ok((await stored()).tasks.some(t=>t.title==='A2 土壤异常复核'));await page.emulateMediaType('print');await page.pdf({path:path.join(out,'soil-report.pdf'),format:'A4',printBackground:true});await page.emulateMediaType('screen');checks.push('soil field switching, follow-up task, print PDF')
const client=await page.createCDPSession();await client.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:out});await click('导出 CSV','main');await pause(700);assert.ok((await fs.readdir(out)).some(f=>f.includes('土壤报告')&&f.endsWith('.csv')));checks.push('soil CSV download')
await go('history');await click('30 天','.segmented',true);await has('30 条样本');await page.select('.history-toolbar select','B2');await has('1.34');await click('全部 · 60 天','.segmented',true);await has('60 条样本');await click('导出数据','main');await pause(500);const csv=(await fs.readdir(out)).find(f=>f.includes('B2-60天'));assert.ok(csv);const content=await fs.readFile(path.join(out,csv),'utf8');assert.equal(content.trim().split('\r\n').length,62);checks.push('7/30/60 day filtering, field change, CSV contents')
await go('harvest');await click('安排采摘','main');await click('确认创建采摘任务','.agri-modal');assert.ok((await stored()).tasks.some(t=>t.title==='B2 蔬菜采摘计划'));await has('已加入农事任务');checks.push('harvest planning to task list')
await go('inspection');await click('暂停巡检','.robot-card');const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('huinong-inspection'))[0].progress);await pause(1300);const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('huinong-inspection'))[0].progress);assert.equal(before,after);await click('继续巡检','.robot-card');await pause(1300);assert.ok((await page.evaluate(()=>JSON.parse(localStorage.getItem('huinong-inspection'))[0].progress))>after);checks.push('robot pause/resume advances correctly')
await go('devices');const valveBefore=(await stored()).valves.D5;await page.click('button[role="switch"]');assert.equal((await stored()).valves.D5,!valveBefore);checks.push('existing irrigation valve control')
await go('map');await page.click('polygon[data-field="A1"]');await has('安排灌溉');await click('安排灌溉','main');assert.ok((await stored()).tasks.some(t=>t.title.includes('灌溉作业')));checks.push('existing interactive map and irrigation task')
await go('crops');await click('A1 水稻','main');await page.type('textarea','复核：叶片健康');await click('添加记录','main');assert.ok((await stored()).growthRecords.some(r=>r.text==='复核：叶片健康'));checks.push('existing crop growth records')
await go('dashboard');await page.click('[aria-label="通知中心"]');await click('全部标为已读','.notification-panel');assert.ok((await stored()).notifications.every(n=>n.read));await page.keyboard.press('Escape');await page.click('[aria-label="关闭动画"]');await page.waitForFunction(() => document.documentElement.dataset.motion === 'off');assert.equal(await page.$eval('html',e=>e.dataset.motion),'off');assert.ok(await page.$$eval('video',videos=>videos.every(e=>e.paused)));await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(() => document.documentElement.dataset.motion === 'off');assert.equal(await page.$eval('html',e=>e.dataset.motion),'off');checks.push('notifications, motion toggle and preference persistence')
await page.setViewport({width:390,height:844});await page.click('[aria-label="打开导航"]');await click('土壤报告','.sidebar');assert.equal(await page.$('.sidebar.is-open'),null);await has('土壤成分分析');checks.push('mobile navigation')
await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await go('dashboard');await page.waitForFunction(() => document.documentElement.dataset.motion === 'off');assert.equal(await page.$eval('html',e=>e.dataset.motion),'off');checks.push('reduced motion support')
assert.deepEqual(errors,[])
await fs.writeFile(path.join(out,'verification.json'),JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks,errors},null,2))
}finally{await browser.close()}

