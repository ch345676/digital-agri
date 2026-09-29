import puppeteer from 'puppeteer-core'
import assert from 'node:assert/strict'
import fs from 'node:fs'
const base=process.env.TEST_BASE||'http://127.0.0.1:3213'
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
const pause=ms=>new Promise(r=>setTimeout(r,ms))
fs.mkdirSync('qa/completion',{recursive:true})
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true})
 await page.evaluateOnNewDocument(()=>localStorage.setItem('agri:session',JSON.stringify({role:'admin',username:'admin',nickname:'管理员'})))
 await page.goto(base+'/#overview',{waitUntil:'networkidle2'})
 const route=async n=>{await page.evaluate(n=>location.hash=n,n);await page.waitForSelector('.page-'+n);await pause(450)}
 const click=async(t,scope='body')=>{await page.evaluate(({t,scope})=>{const roots=[...document.querySelectorAll(scope)],root=roots.at(-1);const b=[...root.querySelectorAll('button')].find(b=>b.textContent.trim().includes(t));if(!b)throw Error('missing '+t);b.click()},{t,scope});await pause(400)}
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('huinong-workflow-v2')))
 await page.waitForSelector('.overview-fields');assert.equal(await page.$$('.overview-fields .field-directory-card').then(x=>x.length),5)
 await page.screenshot({path:'qa/completion/overview.png',fullPage:true})
 await page.click('.overview-fields .field-directory-card');await page.waitForSelector('[role=dialog]');await pause(400)
 assert((await page.$eval('[role=dialog]',e=>e.textContent)).includes('甬优'))
 await page.click('[aria-label="展开面板"]');await pause(500);assert(await page.$eval('.work-sheet',e=>e.getBoundingClientRect().height>700))
 await page.keyboard.press('Escape');await page.waitForSelector('[role=dialog]',{hidden:true})
 await route('alerts');await page.click('.alert-card');await pause(500);await click('分派复核任务');await page.waitForSelector('[role=dialog]')
 await click('开始执行','[role=dialog]');await click('提交验收','[role=dialog]');assert((await state()).tasks[0].status==='执行中')
 const upload=await page.$('[role=dialog] input[type=file]');await upload.uploadFile('public/images/leaf-disease.jpg');await page.waitForFunction(()=>document.querySelector('.photo-grid img'))
 await page.click('.photo-grid button');await pause(400);assert.equal(await page.$$eval('[role=dialog]',x=>x.length),2)
 await page.keyboard.press('Escape');await pause(450);assert.equal(await page.$$eval('[role=dialog]',x=>x.length),1);assert.equal(await page.$eval('body',e=>e.style.overflow),'hidden')
 await click('提交验收','[role=dialog]');await click('验收完成','[role=dialog]');let s=await state();assert.equal(s.tasks[0].status,'已完成');assert.equal(s.incidents.find(i=>i.id===s.tasks[0].incidentId).status,'已解决')
 await page.screenshot({path:'qa/completion/task-complete.png'})
 await page.keyboard.press('Escape');await pause(450);assert.notEqual(await page.$eval('body',e=>e.style.overflow),'hidden')
 await page.click('[aria-label="新建任务"]');await page.waitForSelector('.work-form input[maxlength="60"]');await page.type('.work-form input[maxlength="60"]','测试：五地块工作流')
 await page.select('.work-form select[aria-label="选择地块"]','B1');await page.select('.work-form label:nth-of-type(3) select','').catch(async()=>{await page.evaluate(()=>{const e=[...document.querySelectorAll('.work-form select')].find(e=>e.textContent.includes('稍后分派'));e.value='';e.dispatchEvent(new Event('change',{bubbles:true}))})})
 await click('创建任务','form');await pause(500);assert.equal((await state()).tasks[0].status,'待分派')
 await click('确认分派','[role=dialog]');assert.equal((await state()).tasks[0].status,'待执行');await page.keyboard.press('Escape');await pause(450)
 await page.type('[aria-label="搜索任务"]','没有这一条任务xyz');assert(await page.$('.empty-state'));await route('overview')
 await page.reload({waitUntil:'networkidle2'});assert((await state()).tasks.some(t=>t.title==='测试：五地块工作流'))
 for(const [kind,label] of [['irrigation','缺水补灌'],['patrol','巡检发现异常'],['spray','识别后安排施药']]){
  await route('demo');await click(label,'.scenario-grid');await pause(2800);await click('暂停演示');const before=(await state()).events.length;await pause(3000);assert.equal((await state()).events.length,before)
  await click('继续演示');await route('team');await page.waitForFunction(label=>JSON.parse(localStorage.getItem('huinong-workflow-v2')).tasks.some(t=>t.scenarioId&&t.title===label&&t.status==='已完成'),{timeout:20000},label)
  s=await state();const task=s.tasks.find(t=>t.scenarioId&&t.title===label);assert.equal(task.photos.length,1);assert.equal(s.incidents.find(i=>i.id===task.incidentId).status,'已解决')
 }
 await route('history');const before=await page.$eval('.history-scrubber',e=>e.value);await click('回放');await pause(1800);assert.notEqual(await page.$eval('.history-scrubber',e=>e.value),before);await click('暂停');await page.screenshot({path:'qa/completion/history.png',fullPage:true})
 await route('prediction');const textBefore=await page.$eval('.prediction-metrics',e=>e.textContent);await page.focus('[aria-label="灌溉条件变化"]');await page.keyboard.press('ArrowRight');await pause(600);assert.notEqual(await page.$eval('.prediction-metrics',e=>e.textContent),textBefore)
 await page.setOfflineMode(true);await pause(500);assert((await page.$eval('.connection-status',e=>e.textContent)).includes('离线'));await page.setOfflineMode(false)
 const routes=['overview','irrigation','alerts','identify','patrol','team','prediction','spray','fields','tasks','history','demo','notifications']
 for(const width of [320,390,768]){await page.setViewport({width,height:844,isMobile:true,hasTouch:true});for(const n of routes){await route(n);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${n} overflows at ${width}`)}}
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await route('fields');await page.click('.field-directory-card');await pause(120);await page.keyboard.press('Escape');await page.waitForSelector('[role=dialog]',{hidden:true})
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await route('demo');await page.screenshot({path:'qa/completion/demo.png',fullPage:true});await route('fields');await page.screenshot({path:'qa/completion/fields.png',fullPage:true})
 const count=(await state()).events.length;await page.reload({waitUntil:'networkidle2'});await pause(500);assert.equal((await state()).events.length,count,'reload imports duplicate records')
 assert.deepEqual(errors,[])
 fs.writeFileSync('qa/completion/results.json',JSON.stringify({routes:routes.length,viewports:[320,390,768],checks:['task status guards and photo acceptance','incident resolves on acceptance','nested sheets and focus','field dossiers','unassigned task creation and assignment','empty search','reload persistence and event deduplication','three complete scenarios and pause/resume','history playback','interactive prediction','offline status','reduced motion'],errors},null,2))
 console.log('PASS completion workflows and 39 layouts')
}finally{await browser.close()}
