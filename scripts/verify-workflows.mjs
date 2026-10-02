import puppeteer from 'puppeteer-core'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createWorkflow, validSample, validLedger, ledgerTotals, reviewStatus, offsetDate } from '../src/workflow-model.ts'

assert.equal(offsetDate('2026-10-02',-4),'2026-09-28')
assert.equal(validSample([22,60,1.2,6.5,100,40,200,3]),true)
assert.equal(validSample([22,160,1.2,6.5,100,40,200,3]),false)
assert.equal(validSample([22,60,NaN,6.5,100,40,200,3]),false)
assert.equal(createWorkflow('2026-10-02').samples.length,10)
const task={id:'t',sourceId:'A02',status:'done',revision:2}
const review={alertId:'A02',taskId:'t',taskRevision:1,passed:true}
assert.equal(reviewStatus('A02',[task],[review]),'待复核')
assert.equal(reviewStatus('A02',[task],[{...review,taskRevision:2}]),'已解决')
assert.equal(reviewStatus('A02',[task],[{...review,taskRevision:2,passed:false}]),'需再处理')
const expense={fieldId:'A1',date:'2026-10-02',kind:'labor',title:'test',quantity:2,unit:'小时',unitPrice:30,loss:0}
assert.equal(validLedger(expense),true)
assert.equal(validLedger({...expense,date:'2026-02-30'}),false)
assert.equal(validLedger({...expense,quantity:Infinity}),false)
assert.equal(ledgerTotals([expense,{...expense,kind:'stock-in',quantity:100},{...expense,kind:'harvest',quantity:50,loss:5}],10).cost,60)
assert.equal(ledgerTotals([{...expense,kind:'harvest',quantity:50,loss:5}],10).harvest,45)

const base=process.env.TEST_BASE || 'http://127.0.0.1:5184/'
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,protocolTimeout:90000,args:['--no-sandbox','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-features=CalculateNativeWinOcclusion','--run-all-compositor-stages-before-draw','--disable-gpu']})
const p=await browser.newPage(),errors=[],checks=['pure data validation, sample bounds, review revisions and cost arithmetic']
p.on('pageerror',e=>errors.push(e.message));await p.bringToFront();p.setDefaultTimeout(20000)
await p.evaluateOnNewDocument(()=>localStorage.setItem('huinong-motion','off'))
await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}])
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const go=async route=>{await p.goto(base+'#'+route,{waitUntil:'domcontentloaded'});await p.waitForSelector('.page-'+route);await sleep(120)}
const click=async(text,scope='main')=>{const ok=await p.evaluate((text,scope)=>{const b=[...document.querySelectorAll(scope+' button')].find(b=>!b.disabled&&b.textContent.includes(text));b?.click();return !!b},text,scope);assert.ok(ok,'button '+text);await sleep(150)}
const fill=async(selector,value)=>{await p.$eval(selector,(e,v)=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e),'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))},String(value));await sleep(60)}
const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('agri-platform-state-v1')))
const waitState=async fn=>p.waitForFunction(fn,{polling:100})
const close=async()=>{await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('[role=dialog]'))}
const selectField=async id=>{await p.select('[aria-label="全站地块"]',id);await sleep(100)}
const noOverflow=async label=>{const box=await p.$eval('main',e=>({width:e.clientWidth,scroll:e.scrollWidth}));assert.ok(box.scroll<=box.width+2,label+' '+JSON.stringify(box))}
try {
 await p.setViewport({width:1440,height:1000});await go('dashboard');await p.evaluate(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('huinong-motion','off')});await p.reload({waitUntil:'domcontentloaded'});await go('map')
 await p.$eval('polygon[data-field="A2"]',e=>e.dispatchEvent(new MouseEvent('click',{bubbles:true})));await sleep(150)
 await click('土壤','.map-linked-summary');await p.waitForSelector('.page-soil');assert.equal(await p.$eval('[aria-label="全站地块"]',e=>e.value),'A2');assert.ok((await p.$eval('.soil-visual-heading',e=>e.textContent)).includes('A2'))
 await click('查看土壤历史');await p.waitForSelector('.page-history');assert.equal(await p.$eval('.history-toolbar select',e=>e.value),'A2');checks.push('map → soil → history retains the selected field')
 await go('alerts');await click('查看与处置');await click('创建处置任务','.agri-modal');await waitState(()=>JSON.parse(localStorage.getItem('agri-platform-state-v1')).tasks.some(t=>t.sourceId==='A02'))
 await click('标记作业完成','.agri-modal');assert.ok((await p.$eval('.linked-task',e=>e.textContent)).includes('待复核'))
 assert.equal((await state()).workflow.reviews.length,0)
 assert.equal(await p.$eval('.review-form button[type=submit]',e=>e.disabled),true)
 await fill('[aria-label="处置记录"]','复查 A2 采样点，记录仪器与施肥情况');await fill('[aria-label="复测结果"]','EC 1.82 mS/cm，仍需复核');await click('未通过','.agri-modal');assert.equal((await state()).workflow.reviews[0].passed,false)
 await fill('[aria-label="处置记录"]','复核同一采样点，仪器校准');await fill('[aria-label="复测结果"]','EC 1.52 mS/cm，现场复核通过');await click('复核通过，解决','.agri-modal');assert.equal((await state()).workflow.reviews[0].passed,true);await close();await click('已解决','.segmented');assert.equal(await p.$$eval('.alert-card',es=>es.length),1)
 await go('tasks');await click('重新打开');await go('alerts');await click('全部','.history-toolbar .segmented');assert.equal(await p.$eval('.alert-card',e=>e.dataset.state),'处理中');assert.equal((await state()).workflow.reviews.length,2)
 checks.push('task completion requires independent review; failed/passed reviews persist; reopen invalidates approval without deleting history')
 await go('tasks');await p.$$eval('.task-record',es=>es.find(e=>e.textContent.includes('[A02]')).querySelector('.task-finish').click());await sleep(180);await p.$eval('.feedback-item:last-child .feedback-undo',e=>e.click());await sleep(180);assert.equal((await state()).tasks.find(t=>t.sourceId==='A02').status,'pending');checks.push('task status undo restores state and removes its event')
 await go('soil');await click('录入复测');await fill('[aria-label="复测EC 值"]','1.52');await fill('[aria-label="采样说明"]','同一采样点，测试录入');await click('保存复测记录','.agri-modal');await waitState(()=>JSON.parse(localStorage.getItem('agri-platform-state-v1')).workflow.samples.some(s=>s.origin==='local'))
 assert.ok((await p.$eval('.soil-comparison',e=>e.textContent)).includes('1.52'));await p.reload({waitUntil:'domcontentloaded'});await p.waitForSelector('.soil-comparison');assert.ok((await p.$eval('.soil-comparison',e=>e.textContent)).includes('1.52'))
 await go('history');await p.$eval('.event-timeline button:last-child',e=>e.click());await p.waitForSelector('.event-evidence');assert.equal(await p.$$eval('.event-readings>div',es=>es.length),3);checks.push('sample entry, reload, soil comparison and event-to-chart readings')
 await go('inventory');await click('出库','tbody tr');await fill('.agri-modal input[type=number]','999999');await fill('[aria-label="物资单价"]','3');assert.equal(await p.$eval('.agri-modal button.primary-btn',e=>e.disabled),true);await fill('.agri-modal input[type=number]','10');await click('确认出库','.agri-modal');await waitState(()=>JSON.parse(localStorage.getItem('agri-platform-state-v1')).inventory[0].quantity===470)
 const material=(await state()).workflow.ledger[0];assert.equal(material.unitPrice,3);assert.equal(material.quantity,10);assert.equal(material.fieldId,'A2')
 await go('analytics');assert.ok((await p.$eval('.ledger-metrics',e=>e.textContent)).includes('30.00'))
 await click('记录生产');await p.select('[aria-label="生产记录类型"]','harvest');await fill('[aria-label="生产数量"]','120');await fill('[aria-label="采收损耗"]','5');await click('保存生产记录','.agri-modal');assert.equal((await state()).workflow.ledger[0].quantity,120);assert.ok((await p.$eval('.ledger-metrics',e=>e.textContent)).includes('115'))
 await click('记录生产');await p.select('[aria-label="生产记录类型"]','labor');await fill('[aria-label="生产数量"]','8');await fill('[aria-label="生产单价"]','25');await click('保存生产记录','.agri-modal');assert.ok((await p.$eval('.ledger-metrics',e=>e.textContent)).includes('230.00'));await p.$eval('.feedback-item:last-child .feedback-undo',e=>e.click());await sleep(180);assert.ok((await p.$eval('.ledger-metrics',e=>e.textContent)).includes('30.00'))
 await click('尿素','.ledger-rows');await click('撤销这笔记录','.agri-modal');assert.equal((await state()).inventory[0].quantity,480);checks.push('stock validation, atomic material cost, harvest loss, labor arithmetic and reversible ledger entries')
 await click('演示趋势','.analysis-source');await fill('[aria-label="方案名称"]','基准方案');await click('保存当前方案');await fill('[aria-label="用水减量"]','20');await fill('[aria-label="肥料减量"]','10');await fill('[aria-label="方案名称"]','节水方案');await click('保存当前方案');await p.click('[aria-label="比较方案 基准方案"]');await p.click('[aria-label="比较方案 节水方案"]');assert.equal(await p.$$eval('.scenario-compare-grid article',es=>es.length),2);checks.push('scenario snapshots save and compare using their original volumes')
 await selectField('A1');await go('devices');await p.$eval('[role=switch]',e=>e.click());assert.equal((await state()).valves.D5,false);await waitState(()=>JSON.parse(localStorage.getItem('agri-platform-state-v1')).valves.D5===true);assert.deepEqual((await state()).workflow.commands[0].steps.map(s=>s.phase),['sending','confirmed','executing','done'])
 await p.select('[aria-label="D5 通信演示"]','offline');await p.$eval('[role=switch]',e=>e.click());await waitState(()=>JSON.parse(localStorage.getItem('agri-platform-state-v1')).workflow.commands[0].phase==='failed');assert.equal((await state()).valves.D5,true)
 await p.select('[aria-label="D5 通信演示"]','online');await click('重试相同指令');await waitState(()=>JSON.parse(localStorage.getItem('agri-platform-state-v1')).valves.D5===false);checks.push('simulated command stages, failure preserves valve state, retry applies original target')
 await p.select('[aria-label="D1 通信演示"]','stale');await sleep(12500);assert.ok((await p.$eval('.device-grid',e=>e.textContent)).includes('数据已过期'));checks.push('stale telemetry age is visible')
 await go('inspection');await p.select('[aria-label="巡检通信演示"]','offline');await click('暂停巡检','.robot-card');await sleep(1400);assert.ok((await p.$eval('.patrol-dispatch',e=>e.textContent)).includes('失败'));await p.select('[aria-label="巡检通信演示"]','online');await click('重试巡检指令');await sleep(1300);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('huinong-inspection'))[0].running),false);checks.push('patrol command failure and recovery produce a log')
 await go('dashboard');await p.click('[aria-label="项目展示模式"]');await p.waitForSelector('.story-controls');assert.equal(await p.$eval('[aria-label="全站地块"]',e=>e.value),'A2');await p.click('[aria-label="下一个演示步骤"]');await p.waitForSelector('.page-map');assert.ok(await p.$('.map-detail-shell'));await p.click('[aria-label="退出展示模式"]');await p.waitForSelector('.page-dashboard');assert.equal(await p.$eval('[aria-label="全站地块"]',e=>e.value),'A1');checks.push('guided story keeps its field, supports manual steps and restores prior context')
 const routes=['dashboard','tasks','soil','history','alerts','inspection','harvest','map','devices','crops','analytics','inventory','team','settings']
 await selectField('')
 for(const width of [1440,768,390,320]) { await p.setViewport({width,height:1000});for(const route of routes){await go(route);await noOverflow(route+' '+width)} checks.push('all 14 routes fit '+width+'px');console.log(checks.at(-1)) }
 await p.setViewport({width:390,height:844});await go('soil');await click('录入复测');assert.equal(await p.$eval('[role=dialog]',e=>e.scrollWidth>e.clientWidth+2),false);await close()
 await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await go('map');await selectField('B2');assert.equal(await p.$eval('.map-zoom-layer',e=>getComputedStyle(e).transitionDuration),'0s');checks.push('mobile form fits and reduced motion suppresses new camera motion')
 await fs.writeFile('qa/workflow-state.json',JSON.stringify(await state()))
 // Existing browsers must keep their records when the workflow model is added.
 await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('agri-platform-state-v1'));delete s.workflow;s.tasks=[{id:'legacy-alert',title:'[A02] A2 土壤复测',type:'植保',assignee:'李田丰',date:'2026-10-02',time:'08:00',status:'done'}];s.settings.farmName='迁移验证农场';localStorage.setItem('agri-platform-state-v1',JSON.stringify(s));sessionStorage.clear()})
 await p.reload({waitUntil:'domcontentloaded'});await go('alerts');await click('待复核','.history-toolbar .segmented');assert.equal(await p.$$eval('.alert-card',es=>es.length),1);assert.equal((await state()).settings.farmName,'迁移验证农场');assert.equal((await state()).tasks[0].sourceId,'A02');assert.equal((await state()).workflow.samples.length,10);checks.push('legacy state retains tasks/settings and seeds records without marking old completed work as reviewed')
 await go('devices');await p.$eval('[role=switch]',e=>e.click());await p.reload({waitUntil:'domcontentloaded'});await p.waitForSelector('.command-status');assert.equal((await state()).workflow.commands[0].phase,'failed');assert.equal((await state()).valves.D5,false);checks.push('reload interrupts simulated commands without silently switching a valve')
 assert.deepEqual(errors,[])
 await fs.writeFile('qa/workflow-verification.json',JSON.stringify({passed:true,checks,errors},null,2));console.log(JSON.stringify({passed:true,checks,errors},null,2))
} catch(e) { const ui=await p.evaluate(()=>({title:document.title,route:document.querySelector('.page-stage')?.className,text:document.querySelector('main')?.textContent.slice(0,1200)})).catch(()=>null);await fs.writeFile('qa/workflow-verification.json',JSON.stringify({passed:false,checks,errors,error:String(e),url:p.url(),ui},null,2));throw e } finally { await browser.close() }
